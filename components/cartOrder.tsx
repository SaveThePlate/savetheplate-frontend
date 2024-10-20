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

const BASE_IMAGE_URL = "http://localhost:3001/storage/";

const CartOrder: React.FC<CartOrderProps> = ({ order }) => {
  const router = useRouter();
  
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const statusColor = () => {
    switch (order.status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'confirmed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleCancelOrder = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("No access token found, please log in again.");
      return;
    }

    try {
      await axios.patch(
        `http://localhost:3001/orders/${order.id}/cancel`,
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
        const response = await axios.get(`http://localhost:3001/offers/${order.offerId}`, { 
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="item-container border p-4 rounded-md shadow mb-4 flex items-center">
      <ToastContainer />
      <div className="item-image mr-4">
        {offer?.images && offer.images.length > 0 ? (
          <Image 
            src={`${BASE_IMAGE_URL}${offer.images[0].path}`} 
            alt={offer.title} 
            className="w-16 h-16 object-cover"
            width={50}
            height={50}
          />
        ) : (
          <img src="../../../assets/images/item-2.jpeg" alt="Default Item Image" className="w-16 h-16 object-cover" />
        )}
      </div>
      <div className="item-description flex-grow">
        <div className="item-details">
          <div className="item-name font-semibold">
            {offer ? `${offer.title} x ${order.quantity}` : "Loading..."}
          </div>
          <div className="item-price text-gray-600">
            {offer ? offer.pickupLocation : "N/A"}
          </div>
          <div className="item-date text-gray-500">
            {order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}
          </div>
        </div>
      </div>
      {/* 

      <div className="item-description flex-grow">
        <div className="item-details">
          <div
            className={`status-button ${statusColor()} text-white font-bold px-4 py-2 text-sm inline-block`}
            style={{
              minWidth: '80px', 
              borderRadius: '14px'
            }}
          >
            {order.status}
          </div>
        </div>
      </div>
      */}

      
      {order.status !== 'cancelled' && (
        <button
          className="cancel-button bg-red-600 text-white font-bold px-4 py-2 text-sm ml-4 hover:bg-red-700"
          style={{
            borderRadius: '14px'
          }}
          onClick={handleCancelOrder}
        >
          X
        </button>
      )}
    </div>
  );
};

export default CartOrder;
