"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CartOrderProps {
  order: {
    id: number;
    quantity: number;
    userId: number;
    offerId: number;
    createdAt: string;
    status: string;
    mapsLink?: string;
  };
}

type Offer = {
  id: number;
  owner: string;
  images?: { path?: string; url?: string; alt?: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  quantity: number;
  mapsLink?: string;
};

const DEFAULT_IMAGE = "/logo.png";
const BASE_IMAGE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "") + "/storage/";

const getImage = (filename?: string | null): string => {
  if (!filename) return DEFAULT_IMAGE;

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

const CartOrder: React.FC<CartOrderProps> = ({ order }) => {
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE);

  const fetchOffer = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${order.offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffer(res.data);

      const firstImage = res.data.images?.[0];
      const imageSrc = firstImage?.filename ? getImage(firstImage.filename) : DEFAULT_IMAGE;
      setImageSrc(imageSrc);
    } catch (err) {
      console.error("Failed to fetch offer:", err);
      setError("Failed to load offer data");
      setImageSrc(imageSrc);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffer();
  }, [order.offerId]);

  const isExpired = offer && new Date(offer.expirationDate).getTime() <= Date.now();

  const statusColor = () => {
    switch (order.status) {
      case "pending":
        return "bg-yellow-200 text-yellow-800";
      case "confirmed":
        return "bg-teal-600 text-white";
      case "cancelled":
        return "bg-red-300 text-red-800";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  const handleCancelOrder = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");
    if (order.status !== "pending") return toast.error("Only pending orders can be cancelled");
    setCanceling(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order cancelled");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order");
    } finally {
      setCanceling(false);
    }
  };

  const handleConfirmOrder = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");
    setConfirming(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order confirmed!");
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to confirm order");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className={`w-full bg-white rounded-xl shadow-md flex flex-col sm:flex-row items-center p-4 sm:p-6 mb-6 gap-4 ${
        isExpired ? "opacity-90 ring-1 ring-red-100 bg-red-50" : ""
      }`}
    >
      <ToastContainer
        position="top-right"
        autoClose={1500}
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

      {/* Image */}
      <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 relative rounded-lg overflow-hidden shadow">
        <Image
          src={imageSrc}
          alt={offer?.title || "Offer Image"}
          fill
          sizes="(max-width: 640px) 96px, 128px"
          className="object-cover"
          priority
        />
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <h2 className="text-lg sm:text-xl font-semibold text-teal-600 truncate">
          {offer ? offer.title : "Loading..."} x {order.quantity}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
          Pickup: {offer?.pickupLocation || "N/A"}
        </p>
        {offer?.mapsLink && (
          <a
            href={offer.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-700 font-medium underline hover:text-teal-800 mt-1"
          >
            📍 Show Map
          </a>
        )}
        <p className="text-sm sm:text-base text-gray-500 mt-1 flex items-center gap-2">
          <span>
            Expires:{" "}
            {offer
              ? `${new Date(offer.expirationDate).toLocaleDateString()} at ${new Date(
                  offer.expirationDate
                ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "N/A"}
          </span>
          {isExpired && (
            <span className="inline-block ml-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
              Expired
            </span>
          )}
        </p>
      </div>

      {/* Status & Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-3 sm:mt-0">
        <div className="flex flex-col items-center gap-2">
          <span className={`px-4 py-1 rounded-full font-bold text-center ${statusColor()}`}>
            {order.status.toUpperCase()}
          </span>
          {isExpired && <span className="text-xs text-red-600">This offer expired</span>}
        </div>
        {order.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={handleConfirmOrder}
              disabled={confirming}
              className={`px-4 py-1 rounded-full text-white font-semibold transition-colors ${
                confirming ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {confirming ? "Confirming..." : "Confirm pickup"}
            </button>

            <button
              onClick={handleCancelOrder}
              disabled={canceling}
              className={`px-4 py-1 rounded-full text-white font-semibold transition-colors ${
                canceling ? "bg-red-300 cursor-not-allowed" : "bg-red-400 hover:bg-red-500"
              }`}
            >
              {canceling ? "Cancelling..." : "Cancel"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartOrder;
