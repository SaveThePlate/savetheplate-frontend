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

const Home = () => {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getImage = (filename: string | null): string => {
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
          process.env.NEXT_PUBLIC_BACKEND_URL + `/offers/owner/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
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
    <main className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <ToastContainer />

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 flex flex-col space-y-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center w-full gap-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
            Your Published Offers
          </h1>
          <button
            onClick={() => router.push("./publish")}
            className="flex items-center gap-2 px-5 py-2 bg-white text-[#16a34a] border border-[#16a34a] font-semibold rounded-lg shadow-sm hover:bg-[#16a34a] hover:text-white transition duration-300"
          >
            <PlusCircle size={20} />
            Publish Offer
          </button>
        </div>

        {/* Offers Display */}
        {loading ? (
          <p className="text-gray-600 text-lg text-center mt-10">
            Loading your offers...
          </p>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-10">
            You have no published offers yet.
          </p>
        ) : (
          <div
            className="
              grid 
              grid-cols-1 
              sm:grid-cols-2 
              lg:grid-cols-3 
              xl:grid-cols-4 
              gap-8 
              place-items-center 
              w-full
            "
          >
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
                quantity={offer.price}
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

export default Home;
