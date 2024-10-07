
"use client";
import React, { useEffect, useState } from "react";
import { MapComponent } from "@/components/MapComponent";
import axios from "axios";

const Map = () => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 36.806389, lng: 10.181667 });
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/offers");
        setOffers(response.data);
      } catch (fetchError) {
        setError("Error fetching offers");
        console.error(fetchError);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  return (
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 bg-white min-h-screen w-full">
      <h1 className="text-xl font-semibold text-700">
        View all the available offers around you!
      </h1>

      {error && <p className="text-red-500">{error}</p>}
      
      {loading ? (
        <p>Loading map...</p>
      ) : (
        <MapComponent
          markers={offers.filter(offer => offer.latitude !== null && offer.longitude !== null)}
          center={coordinates}
        />

      )}
    </main>
  );
};

export default Map;
