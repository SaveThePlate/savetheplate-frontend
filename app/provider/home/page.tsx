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
    <main className="border-lg border-black mt-12 sm:pt-16 p-8 bg-[#cdeddf] min-h-screen flex flex-col items-center">
      <ToastContainer />
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-lg bg-white font-bold  rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300"
        onClick={() => router.push("./publish")}
      >
        <PlusCircle size={20} />
        Publish a new offer
      </button>

      <div className="w-full flex-grow flex flex-wrap justify-center gap-6">
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
            // onDelete={handleDelete}
          />
        ))}
      </div>
    </main>
  );
};

export default Home;
