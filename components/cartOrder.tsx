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
};

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const CartOrder: React.FC<CartOrderProps> = ({ order }) => {
  const router = useRouter();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    if (!token) return toast.error("You need to log in.");

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Your order has been cancelled");
    } catch (err) {
      console.error("Error cancelling order:", err);
      toast.error("Failed to cancel order");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found, please log in again.");
      return router.push("/signIn");
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

  return (
    <div className="w-full bg-white rounded-xl shadow-md flex flex-col sm:flex-row items-center p-4 sm:p-6 mb-6 gap-4">
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
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          Expires: {offer 
            ? `${new Date(offer.expirationDate).toLocaleDateString()} at ${new Date(offer.expirationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "N/A"}
        </p>
      </div>

      {/* Status & Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mt-3 sm:mt-0">
        <span className={`px-4 py-1 rounded-full font-bold text-center ${statusColor()}`}>
          {order.status.toUpperCase()}
        </span>
        {order.status !== "cancelled" && (
          <button
            onClick={handleCancelOrder}
            className="px-4 py-1 rounded-full bg-red-400 text-white font-semibold hover:bg-red-500 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default CartOrder;
