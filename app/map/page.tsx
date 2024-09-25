"use client";
import React, { useEffect, useState } from "react";
import { Map } from "@/components/Map";
import axios from "axios";

const MapPage = () => {
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

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
          setError("Unable to retrieve your location");
          console.error(error);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser");
    }

    const fetchOffers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/offers"); // Adjust the URL as needed
        setOffers(response.data);
      } catch (fetchError) {
        setError("Error fetching offers");
        console.error(fetchError);
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
      {coordinates ? <Map coordinates={coordinates} offers={offers}/> : <p>Loading map...</p>}
    </main>
  );
};

export default MapPage;
