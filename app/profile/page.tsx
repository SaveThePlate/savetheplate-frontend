'use client';
import React, { useEffect, useState } from 'react';
import CustomCard from '@/components/CustomCard';
import axios from 'axios';

interface Offer {
  id: number;
  owner: string;
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;


const BASE_IMAGE_URL = "http://localhost:3001/storage/";
const DEFAULT_PROFILE_IMAGE = "/logo.png";

const getImage = (filename: string): string => {
  return filename ? `${BASE_IMAGE_URL}${filename}` : "";
};

const ProfilePage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Profile states
  const [username, setUsername] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>(DEFAULT_PROFILE_IMAGE);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);


  const openModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };  

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) throw new Error("Token not found");
  
      const response = await axios.get("http://localhost:3001/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { username, location, phoneNumber, profileImage } = response.data;
      setUsername(username);
      setLocation(location);
      setPhoneNumber(phoneNumber);
      setPreviewImage(getImage(profileImage) || DEFAULT_PROFILE_IMAGE);

    } catch (err) {
      setError("Failed to fetch profile: " + (err as Error).message);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(file);
        setPreviewImage(reader.result as string); 
      };
      reader.readAsDataURL(file);
    }
  };


  const handleProfileUpdate = async () => {
    const token = localStorage.getItem('accessToken');

    const formData = new FormData();
    formData.append('username', username);
    formData.append('location', location);
    formData.append('phoneNumber', phoneNumber);
    if (profileImage) {
      formData.append('profileImage', profileImage);
    }

    try {
      const response = await axios.put("http://localhost:3001/users/me", formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Profile updated successfully:', response.data);
      await fetchProfileData();
      
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };


  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token found');

      const response = await axios.get("http://localhost:3001/offers/owner", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(response.data);
    } catch (err) {
      setError("Failed to fetch offers: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();

    fetchOffers();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center">
      <div className="w-full flex justify-center mb-6 pt-6">
        <div className="mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="flex flex-col items-center">

              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden" onClick={() => document.getElementById('fileInput')?.click()}>
                <img 
                  src={previewImage} 
                  alt="Profile" 
                  className="object-cover w-full h-full cursor-pointer"
                />
              </div>

              <input
                type="file"
                id="fileInput"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />

              <div className="text-center">
                <h1 className="text-xl font-semibold">{username || "Username"}</h1>
                <p className="text-gray-500">{location || "Location"}</p>
                <p className="text-gray-500">{phoneNumber || "Phone number"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <button
              className="bg-yellow-200 hover:bg-yellow-300 text-black font-bold py-2 px-4 rounded"
              onClick={() => setIsEditModalOpen(true)}
            >
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
                onDetailsClick={() => openModal(offer)}
              />
            ))}
          </div>

        </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
            <form>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="mr-4 py-2 px-4 bg-gray-300 hover:bg-gray-400 rounded text-black"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProfileUpdate}
                  className="py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default ProfilePage;

