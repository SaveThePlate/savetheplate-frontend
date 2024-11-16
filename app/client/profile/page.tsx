'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Offer {
  images: { path: string }[];
  price: number;
  id: number;
  owner: string;
  ownerId: number;
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
}

const DEFAULT_PROFILE_IMAGE = "/logo.png";
const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const getImage = (filename: string | null): string => {
  return filename ? `${BASE_IMAGE_URL}${filename}` : DEFAULT_PROFILE_IMAGE;
};

const ProfilePage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [profileImage, setProfileImage] = useState<string>(DEFAULT_PROFILE_IMAGE);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);



  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Token not found');
      const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + "/users/me", {
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

      const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + `/offers/owner/${id}`, {
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
        const response = await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + '/users/upload-profile-image', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.status === 200) {
          toast.success('Image uploaded successfully!');
          const updatedProfileImage = response.data.profileImage || DEFAULT_PROFILE_IMAGE;
          setProfileImage(updatedProfileImage);
        } else {
          toast.error('Error uploading image. Please try again.');
        }

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
      const response = await axios.put(process.env.NEXT_PUBLIC_BACKEND_URL + '/users/me', data, {
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
    <main className="sm:pt-16 p-6 bg-[#cdeddf] min-h-screen flex flex-col items-center">
      <ToastContainer />
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-6 mb-8 transition-all hover:scale-105">
        <div className="flex items-center mb-6">
          <div className="w-32 h-50 rounded-full overflow-hidden mr-6 border-4 border-gray-100 shadow-md">
            <Image
              src={profileImage}
              alt="Profile"
              className="object-cover w-full h-full cursor-pointer"
              width={128}
              height={128}
              onClick={() => document.getElementById('fileInput')?.click()}
            />
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
          </div>
          <div className="flex-grow">
            <h1 className="text-2xl font-bold text-gray-800">{location || "Location"}</h1>
            <h1 className="text-gray-600">{username || "Username"}</h1>
            <p className="text-gray-600">{phoneNumber || "Phone number"}</p>
          </div>
        </div>
        <div className="flex justify-center mt-4">
          <Button
            className="text-black bg-[#fffc5ed3] sm:text-lg border border-black font-bold py-3 px-6 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-yellow-600"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>     

    </main>
  );
};

export default ProfilePage;
