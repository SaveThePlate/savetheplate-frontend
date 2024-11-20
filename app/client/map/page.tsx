"use client"

import React, { useEffect, useState } from "react";
import axios from "axios";
import MapComponent from "@/components/MapComponent";

const Map = () => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({
    lat: 36.806389,
    lng: 10.181667,
  });
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error obtaining location: ", error);
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }

    const fetchOffers = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + "/offers");
        setOffers(response.data);
      } catch (fetchError) {
        console.error(fetchError);
      } 
    };

    fetchOffers();
  }, []);

  return (

    <main className="sm:pt-16 p-6 bg-[#cdeddf] min-h-screen flex flex-col items-center">
        <div className="w-full flex-grow">
          <MapComponent
            markers={offers.filter(offer => offer.latitude !== null && offer.longitude !== null)}
            center={coordinates}
          />
        </div>
      </main>
  );
};

export default Map;
