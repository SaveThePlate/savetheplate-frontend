"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import MapComponent from "@/components/MapComponent";
import { useLanguage } from "@/context/LanguageContext";

const Map = () => {
  const { t } = useLanguage();
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 36.806389,
    lng: 10.181667,
  });
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    // if (navigator.geolocation) {
    //   navigator.geolocation.getCurrentPosition(
    //     (position) => {
    //       setCoordinates({
    //         lat: position.coords.latitude,
    //         lng: position.coords.longitude,
    //       });
    //     },
    //     (error) => {
    //       console.error("Error obtaining location: ", error);
    //     }
    //   );
    // } else {
    //   console.log("Geolocation is not supported by this browser.");
    // }

    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const headers: any = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + "/offers", { headers });
        setOffers(response.data);
      } catch (fetchError: any) {
        console.error("Failed to fetch offers for map:", fetchError);
        // Silently fail - map will still show with default location
        // Users can still interact with the map even if offers fail to load
      } 
    };

    fetchOffers();
  }, []);

  return (
    <main className="flex flex-col items-center w-full">
      <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-6xl pt-4 sm:pt-6 space-y-6 sm:space-y-8 relative">
        {/* Decorative soft shapes */}
        <div className="absolute top-0 left-[-4rem] w-40 h-40 bg-[#FFD6C9] rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-10 right-[-3rem] w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-40 -z-10" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="text-left space-y-1 sm:space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#344e41] tracking-tight">
              {t("map.title")}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base font-medium">
              {t("map.subtitle")}
            </p>
          </div>
        </div>

        <div className="w-full flex-grow min-h-[60vh]">
          <MapComponent
            markers={offers.filter(offer => offer.latitude !== null && offer.longitude !== null)}
            center={coordinates}
          />
        </div>
      </div>
    </main>
  );
};

export default Map;
