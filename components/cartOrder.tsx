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
};

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const CartOrder: React.FC<CartOrderProps> = ({ order }) => {
  const router = useRouter();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const statusColor = () => {
    switch (order.status) {
      case 'pending':
        return 'bg-[#fffc5e]'; // Yellow from your palette
      case 'confirmed':
        return 'bg-[#159d96]'; // Teal Green
      case 'cancelled':
        return 'bg-[#c88ea1]'; // Dusty Rose
      default:
        return 'bg-[#f0ece7]'; // Light Beige for unknown status
    }
  };

  const handleCancelOrder = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("No access token found, please log in again.");
      return;
    }

    try {
      await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + `/orders/${order.id}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success('Your order is cancelled');
    } catch (err) {
      console.error("Error cancelling order:", error);
      toast.error('Failed to cancel order');
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
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + `/offers/${order.offerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data) setOffer(response.data);
      } catch (err) {
        setError("Failed to fetch offer data");
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [order.offerId, router]);

  // if (loading) return <p>Loading...</p>;
  // if (error) return <p>{error}</p>;

  return (
    <div className="item-container bg-white p-4 sm:p-6 md:p-8 lg:p-10 rounded-lg shadow-lg mb-6 flex items-center justify-between space-x-4 w-full sm:w-auto">
      <ToastContainer />
      <div className="item-image mr-4">
        {offer?.images && offer.images.length > 0 ? (
          <Image
            src={`${BASE_IMAGE_URL}${offer.images[0].path}`}
            alt={offer.title}
            className="w-20 h-20 object-cover rounded-md"
            width={80}
            height={80}
          />
        ) : (
          <Image src="/logo.png" alt="Default Item Image" className="w-20 h-20 object-cover rounded-md" />
        )}
          {/* <Image src="/logo.png"  width={100} height={100} alt="Default Item Image" className="w-20 h-20 object-cover rounded-md" /> */}

      </div>

      <div className="item-description flex-grow">
        <div className="item-details space-y-2">
          <div className="item-name font-semibold text-lg text-[#159d96]">{offer ? `${offer.title} x ${order.quantity}` : "Loading..."}</div>
          <div className="item-location text-[#98cca8]">{offer ? offer.pickupLocation : "N/A"}</div>
          <div className="item-date text-[#c88ea1]">
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
          </div>
        </div>
      </div>

      <div className="status-container flex items-center space-x-4">
        <div
          className={`border border-black status-button ${statusColor()} text-[#27090d] font-bold px-4 py-2 text-sm rounded-full`}
          style={{ minWidth: "90px", textAlign: "center" }}
        >
          {order.status}
        </div>

        {order.status !== 'cancelled' && (
          <button
            className="border border-black cancel-button bg-[#f78484] text-white font-bold px-4 py-2 text-sm rounded-full hover:bg-[#ffbe98]"
            onClick={handleCancelOrder}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default CartOrder;