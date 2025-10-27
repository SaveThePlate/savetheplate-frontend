'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Offer {
  id: number;
  title: string;
  images: { path: string }[];
  expirationDate: string;
  pickupLocation: string;
  quantity: number;
}

const DEFAULT_PROFILE_IMAGE = "/logo.png";
const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const getImage = (filename: string | null) =>
  filename ? `${BASE_IMAGE_URL}${filename}` : DEFAULT_PROFILE_IMAGE;

const ProfilePage = () => {
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Token not found');

      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { username, phoneNumber, profileImage } = response.data;
      setUsername(username || '');
      setPhoneNumber(phoneNumber || '');
      setProfileImage(profileImage || DEFAULT_PROFILE_IMAGE);
    } catch {
      toast.error('Failed to fetch profile');
    }
  };

  // Fetch user offers
  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Token not found');
      const id = JSON.parse(atob(token.split('.')[1])).id;

      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(response.data);
    } catch {
      toast.error('Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchOffers();
  }, []);

  // Stats
  const totalOffers = offers.length;
  const totalQuantity = offers.reduce((sum, o) => sum + o.quantity, 0);

  return (
    <main className="min-h-screen bg-[#cdeddf] p-4 sm:p-6 flex flex-col items-center">
      <ToastContainer />

      {/* Profile Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6 mb-8 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200 mb-4">
          <Image
            src={profileImage}
            alt="Profile Image"
            width={128}
            height={128}
            className="object-cover w-full h-full"
          />
        </div>
        <h1 className="text-xl font-semibold text-gray-800">{username || 'Username'}</h1>
        <p className="text-gray-600 mb-4">{phoneNumber || 'Phone number'}</p>

        {/* Stats */}
        <div className="flex justify-between w-full px-6 mb-4 text-center">
          <div>
            <p className="text-lg font-bold text-gray-800">{totalOffers}</p>
            <p className="text-sm text-gray-500">Offers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">{totalQuantity}</p>
            <p className="text-sm text-gray-500">Items</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4 mt-2">
          <Button className="bg-yellow-200 text-gray-900 hover:bg-yellow-300 px-6 py-2 rounded-full font-semibold">
            Add Offer
          </Button>
          <Button className="bg-blue-200 text-gray-900 hover:bg-blue-300 px-6 py-2 rounded-full font-semibold">
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Offers Section */}
      <div className="w-full max-w-4xl flex flex-col gap-4">
        {loading ? (
          <p className="text-gray-600 text-center">Loading offers...</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-center">No offers yet.</p>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={offer.images?.[0]?.path ? `${BASE_IMAGE_URL}${offer.images[0].path}` : DEFAULT_PROFILE_IMAGE}
                  alt={offer.title}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col flex-grow min-w-[150px]">
                <h2 className="font-semibold text-gray-800">{offer.title}</h2>
                <p className="text-sm text-gray-500">Pickup: {offer.pickupLocation}</p>
                <p className="text-sm text-gray-500">
                  Expires: {new Date(offer.expirationDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
              <div className="text-gray-700 font-bold flex-shrink-0">{offer.quantity} left</div>
            </div>
          ))
        )}
      </div>
    </main>
  );
};

export default ProfilePage;
