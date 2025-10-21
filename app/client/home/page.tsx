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
    <main className="sm:pt-16 p-6 bg-[#cdeddf] min-h-screen flex flex-col items-center">
      <div className="w-full flex-grow">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Loading offers...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-red-600">{error}</div>
          </div>
        ) : (
          <Offers />
        )}
      </div>
    </main>
  );
};

export default Home;
