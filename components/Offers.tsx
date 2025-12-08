"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { ClientOfferCard } from "./offerCard";
import { useRouter } from "next/navigation";
import { resolveImageSource } from "@/utils/imageUtils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useLanguage } from "@/context/LanguageContext";

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
  pickupStartTime?: string;
  pickupEndTime?: string;
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
  const { t } = useLanguage();

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
        setError(t("offers.loading"));
      }
    };

    const fetchOffers = async () => {
      try {
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        // Use fetch instead of axios to avoid automatic cache-control headers
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers?t=${timestamp}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          // Don't use credentials: 'include' - we use Bearer tokens, not cookies
          // Using credentials with CORS requires specific origin, not wildcard
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // normalize images array - normalize all URLs to use current backend URL
        const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
        const mappedOffers: Offer[] = data.map((o: any) => {
          const images = Array.isArray(o.images) ? o.images.map((img: any) => {
            if (!img) return img;
            
            // Normalize absoluteUrl to use current backend URL
            if (typeof img.absoluteUrl === "string") {
              // Extract filename from any URL format
              let filename: string | null = null;
              
              // If it's a full URL, extract the storage path
              if (/^https?:\/\//i.test(img.absoluteUrl)) {
                const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
                if (match && backendOrigin) {
                  // Reconstruct with current backend URL
                  return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
                }
              }
              // If it's a relative storage path
              else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
              }
            }
            
            // Normalize url field if it exists
            if (typeof img.url === "string" && /^https?:\/\//i.test(img.url)) {
              const match = img.url.match(/\/(storage\/.+)$/);
              if (match && backendOrigin) {
                return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
              }
            }
            
            return img;
          }) : [];

          return { ...o, images };
        });

        setOffers(mappedOffers);
      } catch (err) {
        console.error("Failed to fetch offers:", err);
        setError(t("offers.loading"));
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchUserRole(), fetchOffers()]).catch((err) => {
      console.error("Error during data fetching:", err);
      setError(t("offers.error_generic"));
      setLoading(false);
    });
  }, [router, t]);

  // Handle real-time offer updates
  const handleOfferUpdate = useCallback((data: { type: string; offer: any }) => {
    const { type, offer } = data;
    
    // Normalize the offer data to match our format
    const normalizeOffer = (o: any): Offer => {
      const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      const images = Array.isArray(o.images) ? o.images.map((img: any) => {
        if (!img) return img;
        
        // Normalize absoluteUrl to use current backend URL
        if (typeof img.absoluteUrl === "string") {
          // If it's a full URL, extract the storage path and reconstruct
          if (/^https?:\/\//i.test(img.absoluteUrl)) {
            const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
            if (match && backendOrigin) {
              return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
            }
          }
          // If it's a relative storage path
          else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
            return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
          }
        }
        
        // Normalize url field if it exists
        if (typeof img.url === "string" && /^https?:\/\//i.test(img.url)) {
          const match = img.url.match(/\/(storage\/.+)$/);
          if (match && backendOrigin) {
            return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
          }
        }
        
        return img;
      }) : [];
      
      return { ...o, images };
    };

    setOffers((prevOffers) => {
      if (type === 'created') {
        // Add new offer at the beginning
        const normalized = normalizeOffer(offer);
        return [normalized, ...prevOffers];
      } else if (type === 'updated') {
        // Update existing offer
        const normalized = normalizeOffer(offer);
        return prevOffers.map((o) => (o.id === offer.id ? normalized : o));
      } else if (type === 'deleted') {
        // Remove deleted offer
        return prevOffers.filter((o) => o.id !== offer.id);
      }
      return prevOffers;
    });
  }, []);

  // Connect to WebSocket for real-time updates
  useWebSocket({
    onOfferUpdate: handleOfferUpdate,
    enabled: true,
  });

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">{t("offers.loading")}</div>
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
        <div className="text-xl text-gray-600">{t("offers.no_offers_moment")}</div>
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
              pickupStartTime={offer.pickupStartTime}
              pickupEndTime={offer.pickupEndTime}
              pickupLocation={currentLocation}
              mapsLink={currentMapsLink}
              reserveLink={`/client/offers/${offer.id}`}
              owner={offer.owner ? {
                id: offer.owner.id,
                username: offer.owner.username,
                location: offer.owner.location,
                mapsLink: offer.owner.mapsLink,
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
