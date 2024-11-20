"use client";

import React, { useEffect, useState } from "react";
import Offers from "@/components/Offers";
import MapComponent from "@/components/MapComponent";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const Home = () => {

  const [offers, setOffers] = useState<
    { id: number; title: string; latitude: number; longitude: number }[]
  >([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers`
        );
        setOffers(response.data);
      } catch (fetchError) {
        console.error("Failed to fetch offers:", fetchError);
      }
    };

    fetchOffers();
  }, []);


  return (
  
      <main className="sm:pt-16 p-6 bg-[#cdeddf] min-h-screen flex flex-col items-center">
        <div className="w-full flex-grow">
          { (
            <Offers />
          )}
        </div>
      </main>

  );
};

export default Home;
