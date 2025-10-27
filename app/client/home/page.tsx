"use client";

import React, { useEffect, useState } from "react";
import Offers from "@/components/Offers";
import MapComponent from "@/components/MapComponent";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<
    { id: number; title: string; latitude: number; longitude: number }[]
  >([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("No access token found");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setOffers(response.data);
      } catch (fetchError) {
        console.error("Failed to fetch offers:", fetchError);
        setError("Failed to fetch offers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  return (
    <main className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 flex flex-col space-y-10">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Available Offers</h1>
        <Offers />
      </div>
    </main>
  );
};

export default Home;
