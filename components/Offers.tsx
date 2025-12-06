"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { ClientOfferCard } from "./offerCard";
import { useRouter } from "next/navigation";
import { resolveImageSource } from "@/utils/imageUtils";

interface Offer {
  id: number;
  images?: {
    filename: string;
    alt?: string;
    url?: string;
    absoluteUrl: string;
    original?: { url?: string };
  }[];
  title: string;
  ownerId: number;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  expirationDate: string;
  pickupLocation: string;
  mapsLink: string;
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
  };
  user?: { username: string }; // Legacy field
}

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

const OffersPage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(response.data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError("Error fetching user role. Please try again.");
      }
    };

    const fetchOffers = async () => {
      try {
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers?t=${timestamp}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
        });

        // normalize images array and normalize absoluteUrl if backend storage path is provided
        const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
        const mappedOffers: Offer[] = response.data.map((o: any) => {
          const images = Array.isArray(o.images) ? o.images.map((img: any) => {
            if (!img) return img;
            // If backend stored the image under /storage/... make it absolute using the configured backend origin
            if (typeof img.absoluteUrl === "string" && img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
              return { ...img, absoluteUrl: backendOrigin + img.absoluteUrl };
            }
            // leave as-is otherwise
            return img;
          }) : [];

          return { ...o, images };
        });

        setOffers(mappedOffers);
      } catch (err) {
        console.error("Failed to fetch offers:", err);
        setError("Failed to fetch offers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchUserRole(), fetchOffers()]).catch((err) => {
      console.error("Error during data fetching:", err);
      setError("Something went wrong. Please try again later.");
      setLoading(false);
    });
  }, [router]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading offers...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );

  if (offers.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">No offers available at the moment.</div>
      </div>
    );

  // sort expired and sold-out offers
  const now = Date.now();
  const sorted = [...offers].sort((a, b) => {
    const aExpired = new Date(a.expirationDate).getTime() <= now;
    const bExpired = new Date(b.expirationDate).getTime() <= now;
    if (aExpired !== bExpired) return aExpired ? 1 : -1;
    if (a.quantity === 0 && b.quantity !== 0) return 1;
    if (b.quantity === 0 && a.quantity !== 0) return -1;
    return 0;
  });

  return (
    <div className="">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 items-stretch">
        {sorted.map((offer) => {
          const firstImage = offer.images?.[0];
          // Use the unified image resolution utility
          const imageSrc = resolveImageSource(firstImage);
          const imageAlt = firstImage?.alt ?? offer.title;

          // Use owner's current location if available, otherwise fallback to stored pickupLocation
          const currentLocation = offer.owner?.location || offer.pickupLocation;
          const currentMapsLink = offer.owner?.mapsLink || offer.mapsLink;

          return (
            <ClientOfferCard
              key={offer.id}
              offerId={offer.id}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              title={offer.title}
              description={offer.description}
              price={offer.price}
              originalPrice={offer.originalPrice}
              quantity={offer.quantity}
              expirationDate={offer.expirationDate}
              pickupLocation={currentLocation}
              mapsLink={currentMapsLink}
              reserveLink={`/client/offers/${offer.id}`}
              owner={offer.owner ? {
                id: offer.owner.id,
                username: offer.owner.username,
                location: offer.owner.location,
                profileImage: offer.owner.profileImage,
              } : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OffersPage;
