'use client';
import React, { useEffect, useState } from 'react';
import CustomCard from '@/components/CustomCard';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; 
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Offer {
  price: number;
  id: number;
  owner: string;
  ownerId: number;
  images: { path: string }[];
  title: string;
  description: string;
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


  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  const getImage = (filename: string | null): string => {
    return filename ? `${BASE_IMAGE_URL}${filename}` : DEFAULT_PROFILE_IMAGE;

  };

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) throw new Error('Token not found');


      const response = await axios.get("http://localhost:3001/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { username, location, phoneNumber, profileImage } = response.data;
      setUsername(username);
      setLocation(location);
      setPhoneNumber(phoneNumber);
      setProfileImage(profileImage || DEFAULT_PROFILE_IMAGE); 

    } catch (err) {
      setError("Failed to fetch profile: " + (err as Error).message);
    }
  };

  const fetchOffers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('No token found');

      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const id = tokenPayload.id; 

      const response = await axios.get(`http://localhost:3001/offers/owner/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(response.data);
    } catch (err) {
      setError("Failed to fetch offers: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };


  const handleImageUpload = async (newFiles: File[] | null) => {
    if (newFiles && newFiles.length > 0) {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('profileImage', newFiles[0]);
  
      try {
        await axios.post('http://localhost:3001/users/upload-profile-image', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Image uploaded successfully!');
        fetchProfileData(); 
      } catch (error) {
        toast.error('Error uploading image');
        console.error('Image upload error:', error);
      }
    }
  };
  

  const handleProfileUpdate = async () => {
    const token = localStorage.getItem('accessToken');
  
    const data = {
      username,
      location,
      phoneNumber,
      profileImage: JSON.stringify(profileImage), 
    };
  
    try {
      const response = await axios.put('http://localhost:3001/users/me', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (response.status === 200) {
        await fetchProfileData();
        toast.success('Profile updated successfully!');
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating the profile.');
    }
  };

  useEffect(() => {
    fetchProfileData();

    fetchOffers();
  }, []);

  return (
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center">
      
      <ToastContainer />

      <div className="w-full flex justify-center mb-6 pt-6">
        <div className="mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="flex flex-col items-center">

              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4 overflow-hidden" onClick={() => document.getElementById('fileInput')?.click()}>
                <Image 
                  src={profileImage} 
                  alt="Profile" 
                  className="object-cover w-full h-full cursor-pointer"
                  width={100} 
                  height={100}
                />
              </div>

              <input
                type="file"
                id="fileInput"
                className="hidden"
                accept="image/*"
                onChange={(event) => {
                  const files = event.target.files ? Array.from(event.target.files) : null;
                  handleImageUpload(files);
                }}
              />

              <div className="text-center">
                <h1 className="text-xl font-semibold">{username || "Username"}</h1>

                <p className="text-gray-500">{location || "Location"}</p>
                <p className="text-gray-500">{phoneNumber || "Phone number"}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mb-8">

            <Button
              className="bg-orange-700  text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-cyan-700 hover:shadow-xl hover:text-white"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Profile
            </Button>

          </div>

          <hr className="border-gray-300 mb-8" />
          <h2 className="text-xl font-semibold mb-4">My Offers</h2>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
            {offers.map((offer) => (
              <CustomCard
                key={offer.id}
                imageSrc={offer.images.length > 0 ? getImage(offer.images[0].path) : ''}
                owner={offer.owner}
                ownerId={offer.ownerId}
                imageAlt={offer.title}
                title={offer.title}
                price={offer.price}
                description={offer.description}
                expirationDate={offer.expirationDate}
                pickupLocation={offer.pickupLocation}
                reserveLink={`/reserve/${offer.id}`}
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
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border rounded w-full py-2 px-3 text-gray-700 focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Phone Number
                </label>
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
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  onClick={handleProfileUpdate}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel

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
