"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import CustomCard from "./CustomCard";
import { useRouter } from "next/navigation";

interface Offer {
  id: number;
  images?: { filename: string; alt?: string; url?: string, absoluteUrl: string }[];
  title: string;
  ownerId: number;
  description: string;
  price: number;
  quantity: number;
  expirationDate: string;
  pickupLocation: string;
  mapsLink: string;
  user?: { username: string };
}

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

const getImage = (filename?: string | null): string => {
  if (!filename) return DEFAULT_BAG_IMAGE;
  // full URL from API
  if (/^https?:\/\//i.test(filename)) return filename;

  // path starting with /storage/ should be served from backend storage
  if (filename.startsWith("/storage/")) {
    const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
    return origin + filename;
  }

  // leading slash -> public asset in frontend's /public
  if (filename.startsWith("/")) return filename;

  // bare filename, return public asset path
  return `/${filename}`;
};

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
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // normalize images array
        const mappedOffers: Offer[] = response.data.map((o: any) => ({
          ...o,
          images: Array.isArray(o.images) ? o.images : [],
        }));

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
          const imageSrc = getImage(
            firstImage?.absoluteUrl || firstImage?.url || firstImage?.filename
          );
          const imageAlt = firstImage?.alt ?? offer.title;

          return (
            <CustomCard
              key={offer.id}
              offerId={offer.id}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              title={offer.title}
              ownerId={offer.ownerId}
              description={offer.description}
              price={offer.price}
              quantity={offer.quantity}
              expirationDate={offer.expirationDate}
              pickupLocation={offer.pickupLocation}
              mapsLink={offer.mapsLink}
              reserveLink={`/client/offers/${offer.id}`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OffersPage;
