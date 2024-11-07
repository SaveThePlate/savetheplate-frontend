"use client"
import React, { useEffect, useState } from "react";
import axios from "axios";
import MapComponent from "@/components/MapComponent";

const Map = () => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 36.806389, lng: 10.181667 });
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);

  useEffect(() => {
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
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 bg-white min-h-screen w-full">

        <MapComponent
          markers={offers.filter(offer => offer.latitude !== null && offer.longitude !== null)}
          center={coordinates}
        />

    </main>
  );
};

export default Map;
