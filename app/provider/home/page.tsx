"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProviderOfferCard } from "@/components/offerCard";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { resolveImageSource } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";

interface Offer {
  price: number;
  originalPrice?: number;
  quantity: number;
  id: number;
  ownerId: number;
  // backend may return images as array of objects (with filename or path), or attach imageFileName directly
  images?: {
    filename?: string;
    alt?: string;
    url?: string;
    path?: string;
    absoluteUrl?: string;
    original?: { url?: string };
  }[];
  imageFileName?: string;
  title: string;
  description: string;
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
}

const DEFAULT_PROFILE_IMAGE = "/defaultBag.png";

const ProviderHome = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return router.push("/signIn");

        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const id = tokenPayload.id;

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // normalize images array - normalize all URLs to use current backend URL
        const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
        const mappedOffers: Offer[] = response.data.map((o: any) => {
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
        });

        setOffers(mappedOffers);
      } catch (err) {
        setError(t("provider.home.fetch_offers_failed", { error: (err as Error).message }));
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [router, t]);

  const handleDeleteOffer = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    // Optimistic removal
    setOffers(prev => prev.filter(o => o.id !== id));

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(t("provider.home.offer_deleted"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t("provider.home.delete_failed"));
      // refetch if failed
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${JSON.parse(atob(token.split(".")[1])).id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOffers(response.data);
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#F9FAF5] min-h-screen pt-24 pb-20 flex flex-col items-center">
        <ToastContainer
  position="top-right"
  autoClose={1000}
  hideProgressBar={false}
  newestOnTop
  closeOnClick
  pauseOnFocusLoss
  draggable
  limit={3}
  toastClassName="bg-emerald-600 text-white rounded-xl shadow-lg border-0 px-4 py-3"
  bodyClassName="text-sm font-medium"
  progressClassName="bg-white/80"
/>
      <div className="w-full max-w-6xl px-4 sm:px-8 flex flex-col space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-900">
              {t("provider.home.title")}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {t("provider.home.subtitle")}
            </p>
          </div>
          <button
            onClick={() => router.push("./publish")}
            className="flex items-center gap-2 px-5 py-3 bg-green-100 text-green-800 font-semibold rounded-xl shadow-md hover:bg-green-600 hover:text-white transition duration-300 transform hover:scale-[1.02]"
          >
            <PlusCircle size={22} />
            {t("provider.home.publish_offer")}
          </button>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <p className="text-gray-600 text-lg text-center mt-10">{t("provider.home.loading_offers")}</p>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-10">
            {t("provider.home.no_offers")}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {offers.map((offer) => {
  const firstImage = offer.images?.[0] || (offer.imageFileName ? { filename: offer.imageFileName } : null);
  // Use unified image resolution
  const imageSrc = resolveImageSource(firstImage);

  // Use owner's current location if available, otherwise fallback to stored pickupLocation
  const currentLocation = offer.owner?.location || offer.pickupLocation;
  const currentMapsLink = offer.owner?.mapsLink || offer.mapsLink;

  return (
      <ProviderOfferCard
        key={offer.id}
        offerId={offer.id}
        imageSrc={imageSrc}
        imageAlt={offer.title}
        title={offer.title}
        price={offer.price}
        originalPrice={offer.originalPrice}
        quantity={offer.quantity}
        description={offer.description}
        expirationDate={offer.expirationDate}
        pickupLocation={currentLocation}
        mapsLink={currentMapsLink}
        ownerId={offer.ownerId}
        onDelete={handleDeleteOffer}
        onUpdate={(id, data) => {
          // Refresh offers after update
          setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
        }}
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
        )}
      </div>
    </main>
  );
};

export default ProviderHome;
