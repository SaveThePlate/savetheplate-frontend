"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Offer {
  id: number;
  owner: string;
  images?: { filename: string; alt?: string; url?: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  quantity: number;
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

  // bare filename, fallback to public folder
  return `/${filename}`;
};

const Offers = () => {
  const router = useRouter();
  const { id } = useParams();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [inCart, setInCart] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_BAG_IMAGE);

  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/signIn");
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const firstImage = res.data.images?.[0];
        const imageSrc = firstImage?.filename ? getImage(firstImage.filename) : DEFAULT_BAG_IMAGE;
        setImageSrc(imageSrc);
        setOffer(res.data);
      } catch {
        toast.error("Failed to load offer");
      }
    };
    fetchOffer();
  }, [id, router]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        router.push("/signIn");
        return;
      }
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/get-user-by-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUserId(res.data.id))
      .catch(() => router.push("/signIn"));
  }, [router]);

  const handleOrder = async () => {
    if (!offer) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return toast.error("You need to log in");
    if (new Date(offer.expirationDate).getTime() <= new Date().getTime()) {
      return toast.error("This offer has expired and cannot be ordered.");
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`,
        { userId, offerId: offer.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInCart(true);
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to order");
    }
  };

  if (!offer) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] min-h-screen flex justify-center items-center px-4 py-10">
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
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        {/* Image */}
        <div className="relative w-full h-60 bg-gray-100">
          <Image
            src={imageSrc}
            alt={offer.title}
            fill
            // card has max-w-md; use 100vw on small screens, otherwise limit to ~400px
            sizes="(max-width: 640px) 100vw, 400px"
            // This image is likely the Largest Contentful Paint (LCP) on the offer detail page.
            // Mark it as priority so Next.js preloads it to improve LCP metrics.
            priority
            className="object-cover"
          />
          <div className="absolute top-3 right-3 bg-emerald-100 text-emerald-800 text-sm font-semibold px-3 py-1 rounded-full">
            {offer.quantity} left
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          <h1 className="text-2xl font-bold text-gray-900">{offer.title}</h1>
          <p className="text-gray-700 text-sm leading-relaxed">{offer.description}</p>

          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Pickup:</span> {offer.pickupLocation}
            </p>
            <p>
              <span className="font-semibold">Expires:</span>{" "}
              {new Date(offer.expirationDate).toLocaleDateString()}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex justify-center items-center gap-4 mt-3">
            <button
              onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
              className="px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 font-semibold text-lg"
              disabled={quantity <= 1}
            >
              −
            </button>
            <span className="text-lg font-semibold text-gray-800">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(q + 1, offer.quantity))}
              className="px-3 py-1.5 bg-gray-100 rounded-full hover:bg-gray-200 font-semibold text-lg"
              disabled={quantity >= offer.quantity}
            >
              +
            </button>
          </div>

          {/* Order Button */}
          <button
            onClick={handleOrder}
            disabled={offer.quantity === 0}
            className={`w-full py-3 mt-4 rounded-full font-semibold text-lg transition-all ${
              offer.quantity === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : inCart
                ? "bg-emerald-400 text-white hover:bg-emerald-500"
                : "bg-[#FFAE8A] text-white hover:bg-[#ff9966]"
            }`}
          >
            {offer.quantity === 0
              ? "Out of Stock"
              : inCart
              ? "Added to Cart"
              : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Offers;