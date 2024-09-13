'use client';
import React, { useEffect, useState } from 'react';
import CustomCard from '@/components/CustomCard';
import axios from 'axios';
import { useRouter } from "next/navigation";
interface Offer {
  id: number;
  owner: string;
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  primaryColor: string;
}

const BASE_IMAGE_URL = "http://localhost:3001/storage/";
const getImage = (filename: string): string => {
  return filename ? `${BASE_IMAGE_URL}${filename}` : "";
};

const ProfilePage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const router = useRouter();

  const openModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken'); 
    router.push('/signIn');
  };

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem('accessToken'); 
        const response = await axios.get("http://localhost:3001/offers/owner", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!token) {
          console.log("No token found, redirecting to signIn");
          router.push("/signIn");
          return;
        }
  
        setOffers(response.data);
      } catch (err) {
        setError("Failed to fetch offers: " + (err instanceof Error ? err.message : ''));
      } finally {
        setLoading(false);

      }
    };
  
    fetchOffers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center"> 
      <div className="w-full flex justify-center mb-6 pt-6">
        
      <div className="mx-auto">

      <button className="bg-red-200" onClick={handleLogout}> Delete token / Log out</button> 

        <div className="flex items-center justify-center mb-8">
          
          <div className="flex flex-col items-center">

          <div className="w-24 h-24 bg-gray-200 rounded-full mb-4">
          </div>
          <div className="text-center">

              <h1 className="text-xl font-semibold">Business name</h1>
              <p className="text-gray-500">Location</p>
              <p className="text-gray-500">Phone number</p>
            </div>

          </div>

        </div>


        <div className="flex justify-center mb-8">
          <button className="bg-yellow-200 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded">
            Edit Profile
          </button>
        </div>
        <hr className="border-gray-300 mb-8" />
        <h2 className="text-lg font-semibold mb-4">My Offers</h2>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
        {offers.map((offer) => (


        <CustomCard
        key={offer.id}
        imageSrc={offer.images.length > 0 ? getImage(offer.images[0].path) : ''}
        imageAlt={offer.title}
        title={offer.title}
        description={offer.description}
        expirationDate={offer.expirationDate}
        pickupLocation={offer.pickupLocation}
        reserveLink={`/reserve/${offer.id}`}
        primaryColor={offer.primaryColor}
        />
        ))}

        </div>
       
      </div>

      </div>
    </main>
  );
};
export default ProfilePage;



