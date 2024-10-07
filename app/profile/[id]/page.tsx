'use client';
import React, { useCallback, useEffect, useState } from 'react';
import CustomCard from '@/components/CustomCard';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import { useParams } from 'next/navigation';
import Image from 'next/image';


interface Offer {
  id: number;
  owner: string;
  ownerId: number;
  images: { path: string }[];
  title: string;
  description: string;
  price: number;
  expirationDate: string;
  pickupLocation: string;
}

const BASE_IMAGE_URL = "http://localhost:3001/storage/";
const DEFAULT_PROFILE_IMAGE = "/logo.png";

const ProfilePage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Profile states
  const [username, setUsername] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_PROFILE_IMAGE); 

  const params = useParams();
  const id = params.id;

  const fetchProfileData = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Token not found');
      
      const response = await axios.get(`http://localhost:3001/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { username, location, phoneNumber, profileImage } = response.data;
      setUsername(username);
      setLocation(location);
      setPhoneNumber(phoneNumber);
      setProfileImage(profileImage || DEFAULT_PROFILE_IMAGE); 
    } catch (err) {
      toast.error("Failed to fetch profile");
    }
  }, [id]); 

  const fetchOffers = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(`http://localhost:3001/offers/owner/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(response.data);
    } catch (err) {
      setError("Failed to fetch offers: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOffers();
    fetchProfileData();
  }, [fetchOffers, fetchProfileData]);

  return (
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center">
      <ToastContainer />
      <div className="w-full flex justify-center mb-6 pt-6">
        <div className="mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden">
                <Image
                  src={profileImage}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="text-center">
                <h1 className="text-xl font-semibold">{username || "Username"}</h1>
                <p className="text-gray-500">{location || "Location"}</p>
                <p className="text-gray-500">{phoneNumber || "Phone number"}</p>
              </div>
            </div>
          </div>
          <hr className="border-gray-300 mb-8" />
          <h2 className="text-lg font-semibold mb-4">Offers</h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
            {offers.map((offer) => (
              <CustomCard
                key={offer.id}
                imageSrc={offer.images.length > 0 ? `${BASE_IMAGE_URL}${offer.images[0].path}` : ''}
                owner={offer.owner}
                ownerId={offer.ownerId}
                imageAlt={offer.title}
                title={offer.title}
                description={offer.description}
                price={offer.price}
                expirationDate={offer.expirationDate}
                pickupLocation={offer.pickupLocation}
                reserveLink={`/reserve/${offer.id}`}  />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;
