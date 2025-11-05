"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomCard from "@/components/CustomCard";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

interface Offer {
  price: number;
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
  pickupLocation: string;
  mapsLink: string;
}

const DEFAULT_PROFILE_IMAGE = "/defaultBag.png";

const ProviderHome = () => {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getImage = (filename: string | null | undefined): string | undefined => {
    if (!filename) return undefined;

    // full URL from API
    if (/^https?:\/\//i.test(filename)) return filename;

    // path starting with /storage/ should be served from backend storage
    if (filename.startsWith("/storage/")) {
      const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      return origin + filename;
    }

    // leading slash -> public asset in the frontend's /public
    if (filename.startsWith("/")) return filename;

    // Bare filename (e.g. "smallsurprisebag.png") — prefer using the public asset
    // located in the frontend `public/` folder: "/smallsurprisebag.png".
    // If that fails to load, CustomCard will try a backend /storage/ variant once.
    return `/${filename}`;
  };

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

        setOffers(response.data);
      } catch (err) {
        setError("Failed to fetch offers: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [router]);

  const handleDeleteOffer = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    // Optimistic removal
    setOffers(prev => prev.filter(o => o.id !== id));

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Offer deleted successfully");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete offer");
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
              Your Published Offers
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your offers and reach more customers 🌍
            </p>
          </div>
          <button
            onClick={() => router.push("./publish")}
            className="flex items-center gap-2 px-5 py-3 bg-green-100 text-green-800 font-semibold rounded-xl shadow-md hover:bg-green-600 hover:text-white transition duration-300 transform hover:scale-[1.02]"
          >
            <PlusCircle size={22} />
            Publish Offer
          </button>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <p className="text-gray-600 text-lg text-center mt-10">Loading your offers...</p>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-10">
            You have no published offers yet. Start by creating one!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {offers.map((offer) => {
  let filename: string | undefined;
  if (offer.imageFileName) filename = offer.imageFileName;
  else if (Array.isArray(offer.images) && offer.images.length > 0) {
    const first = offer.images[0] as any;
    // Prefer original.url when present (frontend public asset), then fall back to url/filename/path
    filename = first?.original?.url ?? first?.url ?? first?.filename ?? first?.path ?? (typeof first === "string" ? first : undefined);
  }

  const imageSrc = getImage(filename) || DEFAULT_PROFILE_IMAGE;

  return (
      <CustomCard
        key={offer.id}
        offerId={offer.id}
        imageSrc={imageSrc}
        ownerId={offer.ownerId}
        imageAlt={offer.title}
        title={offer.title}
        price={offer.price}
        quantity={offer.quantity}
        description={offer.description}
        expirationDate={offer.expirationDate}
        pickupLocation={offer.pickupLocation}
        mapsLink={offer.mapsLink}
        reserveLink={`/reserve/${offer.id}`}
        onDelete={handleDeleteOffer}
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
