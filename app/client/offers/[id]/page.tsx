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
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  quantity: number; // Make sure backend returns this
}

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const getImage = (path?: string | null) => {
  if (!path) return "/logo.png";
  const trimmed = String(path).replace(/^"|"$/g, "").trim();
  if (trimmed.startsWith("http")) return trimmed;
  return `${BASE_IMAGE_URL}${trimmed}`;
};

const Offers = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [inCart, setInCart] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch offer
  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/signIn");

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOffer(response.data);
        setQuantity(response.data.quantity > 0 ? 1 : 0); // start at 1 if available
      } catch {
        toast.error("Failed to fetch offer");
      }
    };
    fetchOffer();
  }, [id, router]);

  // Fetch user ID
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/get-user-by-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUserId(res.data.id))
      .catch(() => router.push("/signIn"));
  }, [router]);

  const increaseQuantity = () => {
    if (!offer) return;
    setQuantity((prev) => Math.min(prev + 1, offer.quantity));
  };

  const decreaseQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  const handleOrder = async () => {
    if (!offer || quantity <= 0) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return toast.error("You need to log in");

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`,
        { userId, offerId: offer.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInCart(true);
      toast.success("Your order was successful!");
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Error placing order");
      }
    }
  };

  if (!offer) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e6f7f2] to-[#fefefe] flex flex-col items-center p-4 pt-24 pb-12">
      <ToastContainer />

      {/* Image Card */}
      <div className="relative w-full max-w-md sm:max-w-lg h-72 sm:h-96 rounded-3xl overflow-hidden shadow-xl mb-6">
        <Image
          src={getImage(offer.images?.[0]?.path)}
          alt={offer.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-3 right-3 bg-teal-600 text-white px-3 py-1 rounded-full text-sm shadow-lg font-bold">
          {offer.quantity} left
        </div>
      </div>

      {/* Title & Description */}
      <div className="max-w-md text-center mb-6 px-4 sm:px-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{offer.title}</h1>
        <p className="text-gray-700 text-lg sm:text-xl mt-2">{offer.description}</p>
      </div>

      {/* Quantity Selector */}
      <div className="flex flex-col sm:flex-row justify-center items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={decreaseQuantity}
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="px-6 text-lg sm:text-xl font-medium">
            {quantity} / {offer.quantity}
          </span>
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 transition-colors text-lg sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={increaseQuantity}
            disabled={quantity >= offer.quantity}
          >
            +
          </button>
        </div>
      </div>

      {/* Details Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Pickup Location:</span> {offer.pickupLocation}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Expiration Date:</span>{" "}
          {new Date(offer.expirationDate).toLocaleDateString()}
        </p>
      </div>

      {/* Add to Cart Button */}
      <div className="w-full max-w-md px-4 sm:px-0">
        <button
          onClick={handleOrder}
          disabled={offer.quantity === 0}
          className={`w-full py-3 rounded-full font-bold transition-all duration-300 text-lg sm:text-xl
            ${offer.quantity === 0
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : inCart
              ? "bg-green-400 text-white hover:bg-green-500"
              : "bg-yellow-200 text-gray-900 hover:bg-yellow-300"
            }`}
        >
          {offer.quantity === 0 ? "Out of Stock" : inCart ? "Added to Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default Offers;
