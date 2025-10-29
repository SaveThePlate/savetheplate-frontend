"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
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
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  quantity: number;
  mapsLink?: string;
};

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const CartOrder: React.FC<CartOrderProps> = ({ order }) => {
  const router = useRouter();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<boolean>(false);
  const [canceling, setCanceling] = useState<boolean>(false);

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
    if (!token) {
        router.push("/signIn");
        return;
      }
    if (canceling) return;
    // only allow cancelling when order is pending
    if (order.status !== "pending") {
      return toast.error("Only pending orders can be cancelled");
    }

    setCanceling(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Your order has been cancelled");
      // reload to show updated status
      window.location.reload();
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      toast.error("Failed to cancel order");
    } finally {
      setCanceling(false);
    }
  };

  const handleConfirmOrder = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        router.push("/signIn");
        return;
      }
    if (confirming) return; // prevent double clicks
    setConfirming(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order confirmed. Thanks!");
      // reload to reflect updated status. router.refresh() may cause intermittent UI issues
      // in some app-router setups; fallback to full reload which is safe here.
      window.location.reload();
    } catch (err: any) {
      console.error("Error confirming order:", err);
      toast.error((err as any)?.response?.data?.message || "Failed to confirm order");
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        router.push("/signIn");
        return;
      }

    const fetchOffer = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${order.offerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) setOffer(response.data);
      } catch {
        setError("Failed to fetch offer data");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [order.offerId, router]);

  const isExpired = !!offer && new Date(offer.expirationDate).getTime() <= Date.now();

  return (
    <div className={`w-full bg-white rounded-xl shadow-md flex flex-col sm:flex-row items-center p-4 sm:p-6 mb-6 gap-4 ${
      isExpired ? "opacity-90 ring-1 ring-red-100 bg-red-50" : ""
    }`}>
      <ToastContainer />

      {/* Image */}
      <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 relative rounded-lg overflow-hidden shadow">
        <Image
          src={offer?.images?.[0]?.path ? `${BASE_IMAGE_URL}${offer.images[0].path}` : "/logo.png"}
          alt={offer?.title || "Offer Image"}
          fill
          className="object-cover"
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
            Expires: {offer
              ? `${new Date(offer.expirationDate).toLocaleDateString()} at ${new Date(offer.expirationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
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
          {isExpired && (
            <span className="text-xs text-red-600">This offer expired</span>
          )}
        </div>
        {order.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={handleConfirmOrder}
              disabled={confirming}
              className={`px-4 py-1 rounded-full text-white font-semibold transition-colors ${
                confirming ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {confirming ? 'Confirming...' : 'Confirm pickup'}
            </button>

            <button
              onClick={handleCancelOrder}
              disabled={canceling}
              className={`px-4 py-1 rounded-full text-white font-semibold transition-colors ${
                canceling ? 'bg-red-300 cursor-not-allowed' : 'bg-red-400 hover:bg-red-500'
              }`}
            >
              {canceling ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartOrder;
