"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomCard from "@/components/CustomCard";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";

interface Offer {
  price: number;
  quantity: number;
  id: number;
  owner: string;
  ownerId: number;
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  mapsLink: string;
}

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";
const DEFAULT_PROFILE_IMAGE = "/logo.png";

const ProviderHome = () => {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getImage = (filename: string | null) => {
    return filename ? `${BASE_IMAGE_URL}${filename}` : DEFAULT_PROFILE_IMAGE;
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No token found");

        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const id = tokenPayload.id;

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOffers(response.data);
      } catch (err) {
        setError("Failed to fetch offers: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  return (
    <main className="bg-[#F9FAF5] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <ToastContainer />
      <div className="w-full max-w-6xl px-4 sm:px-8 flex flex-col space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-900">
              Your Published Offers
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your offers and reach more customers 🌍
            </p>
          </div>
          <button
            onClick={() => router.push("./publish")}
            className="flex items-center gap-2 px-5 py-3 bg-green-100 text-green-800 font-semibold rounded-xl shadow-md hover:bg-green-600 hover:text-white transition duration-300 transform hover:scale-[1.02]"
          >
            <PlusCircle size={22} />
            Publish Offer
          </button>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <p className="text-gray-600 text-lg text-center mt-10">
            Loading your offers...
          </p>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-10">
            You have no published offers yet. Start by creating one!
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {offers.map((offer) => (
              <CustomCard
                key={offer.id}
                offerId={offer.id}
                imageSrc={
                  offer.images.length > 0 ? getImage(offer.images[0].path) : ""
                }
                ownerId={offer.ownerId}
                imageAlt={offer.title}
                title={offer.title}
                price={offer.price}
                quantity={offer.quantity}
                description={offer.description}
                expirationDate={offer.expirationDate}
                pickupLocation={offer.pickupLocation}
                mapsLink={offer.mapsLink}
                reserveLink={`/reserve/${offer.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ProviderHome;
