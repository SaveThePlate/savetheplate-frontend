"use client";
import React, { useEffect, useState } from 'react';
import Offers from '@/components/Offers';
import { Button } from '@/components/ui/button';
import MapComponent from '@/components/MapComponent';
import axios from 'axios';

const Home = () => {
  const [showMap, setShowMap] = useState(false); 
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 36.806389, lng: 10.181667 });

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
    <main className=" sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center">
      <div className="w-full flex justify-center mb-6 pt-6 space-x-4">

        <Button
          onClick={() => setShowMap(false)}
          className={`${
            !showMap
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
              : 'bg-gray-200 text-gray-600'
          } font-bold py-4 px-8 rounded-full shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-110`}
        >
          View Offers 🛍️
        </Button>


        <Button
          onClick={() => setShowMap(true)}
          className={`${
            showMap
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
              : 'bg-gray-200 text-gray-600'
          } font-bold py-4 px-8 rounded-full shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-110`}
        >
          View Map 📍
        </Button>
      </div>

      <div className="w-full flex-grow">
        {showMap ? 
        <MapComponent  markers={offers.filter(offer => offer.latitude !== null && offer.longitude !== null)}
                       center={coordinates}/> 
          : <Offers />}
      </div>
    </main>
  );
};

export default Home;
