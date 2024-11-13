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
}

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const Offers = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [inCart, setInCart] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found, please log in again.");
        return router.push("/signIn");
      }

      axios
        .get(process.env.NEXT_PUBLIC_BACKEND_URL + `/offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (response.data) setOffer(response.data);
        })
        .catch(() => setError("Failed to fetch offer"));
    };

    fetchOffer();
  }, [id, router]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    axios
      .get(process.env.NEXT_PUBLIC_BACKEND_URL + "/auth/get-user-by-token", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.data) setUserId(response.data.id);
      })
      .catch(() => router.push("/signIn"));
  }, [router]);

  const increaseQuantity = () => setQuantity((prev) => prev + 1);
  const decreaseQuantity = () => quantity > 1 && setQuantity((prev) => prev - 1);
  const toggleCart = () => setInCart((prev) => !prev);

  const handleOrder = async () => {
    if (offer) {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          alert("You need to be logged in to place an order.");
          return;
        }

        await axios.post(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/orders",
          {
            userId: userId,
            offerId: offer.id,
            quantity: quantity,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setInCart(true);
        toast.success('Your order is successful');
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          if (error.response && error.response.data.message === 'Requested quantity exceeds available stock') {
            toast.error('The requested quantity exceeds available stock.');
          } else {
            toast.error('Error in placing order');
          }
        }
      }
    }
  };

  if (!offer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 mt-8">
      <ToastContainer />
      
      {/* Offer Image Section */}
      <div className="image-container flex justify-center mb-8">
        <Image
          // src={"/logo.png"}
          src={offer.images.length > 0 ? `${BASE_IMAGE_URL}${offer.images[0].path}` : "/logo.png"}
          alt={offer.title}
          width={150}
          height={150}
          className="rounded-lg shadow-lg object-cover"
        />
      </div>

      {/* Offer Title & Description */}
      <div className="item-details text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{offer.title}</h1>
        <p className="text-lg text-green-600 font-medium mt-2">{offer.description}</p>
      </div>

      {/* Quantity and Cart Button */}
      <div className="cart flex justify-center items-center mb-8 space-x-4">
        <div className="quantity flex items-center space-x-2 border border-gray-300 rounded-lg overflow-hidden">
          <button
            className="bg-gray-300 px-4 py-2"
            onClick={decreaseQuantity}
          >
            -
          </button>
          <p className="mx-4 text-lg">{quantity}</p>
          <button
            className="bg-gray-300 px-4 py-2"
            onClick={increaseQuantity}
          >
            +
          </button>
        </div>
      </div>

      {/* Offer Additional Details */}
      <div className="additional-details mb-6 space-y-2">
        <h2 className="text-lg font-semibold text-center text-gray-800">Offer Details</h2>
        {/* <p className="text-center text-gray-700">
          <span className="font-semibold">Owner:</span> {offer.owner}
        </p> */}
        <p className="text-center text-gray-700">
          <span className="font-semibold">Pickup Location:</span> {offer.pickupLocation}
        </p>
        <p className="text-center text-gray-700">
          <span className="font-semibold">Expiration Date:</span> {new Date(offer.expirationDate).toLocaleDateString()}
        </p>
      </div>

      {/* Add to Cart Button */}
      <div className="text-center mb-8">
        <button
          onClick={handleOrder}
          className={`py-2 px-6 rounded-full text-black font-bold sm:text-lg border border-black transition-all duration-300 ease-in-out 
            ${inCart ? "bg-green-300 hover:bg-green-500" : "bg-[#fffc5ed3] hover:bg-[#fffc8ad1]"}`}
        >
          {inCart ? "Added to Cart" : "Add to Cart"}
        </button>
      </div>

    </div>
  );
};

export default Offers;
