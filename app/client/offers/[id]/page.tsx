"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import axios, { AxiosError } from "axios";
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
        .get(`http://localhost:3001/offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          if (response.data) setOffer(response.data);
        });
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
          } 
          toast.error('Error in placing order');
        }
        

      }
    }
  };

  if (!offer) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container  mx-auto p-4 mt-16">
      <ToastContainer />
      <div className="image flex justify-center mb-8">
        {offer.images.length > 0 ? (
          <Image
            src={`${BASE_IMAGE_URL}${offer.images[0].path}`}
            alt={offer.title}
            width={300}
            height={200}
            className="rounded-md"
          />
        ) : (
          <div className="bg-gray-200 w-80 h-52 flex items-center justify-center rounded-md">
            <p className="text-gray-500">No Image Available</p>
          </div>
        )}
      </div>

      <div className="item-details text-center mb-6">
        <h1 className="text-2xl font-bold">{offer.title}</h1>
        <p className="text-xl text-green-500 font-semibold">
          {offer.description}
        </p>
      </div>

      <div className="cart flex justify-center items-center mb-8">
        <div className="quantity flex items-center">
          <button className="bg-gray-300 p-2 rounded-l-lg" onClick={decreaseQuantity}>
            -
          </button>
          <p className="mx-4 text-lg">{quantity}</p>
          <button className="bg-gray-300 p-2 rounded-r-lg" onClick={increaseQuantity}>
            +
          </button>
        </div>
      </div>

      <div className="additional-details mb-6">
        <h2 className="text-lg font-bold text-center mb-4">Offer Details</h2>
        <p className="text-center mb-2">
          <span className="font-bold">Owner:</span> {offer.owner}
        </p>
        <p className="text-center mb-2">
          <span className="font-bold">Pickup Location:</span> {offer.pickupLocation}
        </p>
        <p className="text-center mb-2">
          <span className="font-bold">Expiration Date:</span> {new Date(offer.expirationDate).toLocaleDateString()}
        </p>
      </div>

      <div className="text-center mb-8">
        <button
          onClick={handleOrder}
          className={`py-2 px-6 rounded-md text-white ${inCart ? "bg-green-600" : "bg-blue-600"}`}
        >
          {inCart ? "Added to Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
};

export default Offers;
