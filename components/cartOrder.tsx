"use client";

import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";

interface CartOrderProps {
  order: {
    id: number;
    quantity: number;
    userId: number;
    offerId: number;
    createdAt: string;
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
  const params = useParams();  
  
  const { id } = params;
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("No access token found, please log in again.");
      return router.push("/signIn");
    }

    const fetchOffer = async () => {
      try {
        console.log("offerId from order ", order.offerId);
        const response = await axios.get(`http://localhost:3001/offers/${order.offerId}`, { 
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(response => {
          console.log('offer data ',response.data);
          if (response.data) setOffer(response.data);
        })
      } catch (err) {
        setError("Failed to fetch offer data");
      } finally {
        setLoading(false);
      }
    };
  
    fetchOffer();
    }, [order.offerId]);
  
  const increaseQuantity = () => {};

  const decreaseQuantity = () => {};

  // Handle loading and error states
  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="item-container border p-4 rounded-md shadow mb-4 flex items-center">
      <div className="item-image mr-4">
        {offer?.images && offer.images.length > 0 ? (
          <Image 
          src={`${BASE_IMAGE_URL}${offer.images[0].path}`} 
          alt={offer.title} 
          className="w-16 h-16 object-cover"
          width={50}
          height={50}></Image>
        ) : (
          <Image src="../../../assets/images/item-2.jpeg" alt="Default Item Image" className="w-16 h-16 object-cover" />
        )}
      </div>
      <div className="item-description flex-grow">
        <div className="item-details">
          <div className="item-name font-semibold">{offer ? offer.title : "Loading..."}</div>
          <div className="item-price text-gray-600">
            {offer ? offer.pickupLocation : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartOrder;


