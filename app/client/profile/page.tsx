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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    phoneNumber: '',
    profileImage: DEFAULT_PROFILE_IMAGE,
  });
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

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
      setFormData({
        username: username || '',
        phoneNumber: phoneNumber || '',
        profileImage: profileImage || DEFAULT_PROFILE_IMAGE,
      });
    } catch (err) {
      toast.error('Failed to fetch profile');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) throw new Error('Token not found');
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          username: formData.username,
          phoneNumber: formData.phoneNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // reflect changes locally
      setUsername(formData.username);
      setPhoneNumber(formData.phoneNumber);
      setIsEditModalOpen(false);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error('Failed to update profile');
    }
  };

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

  return (
    <main className="bg-[#E6F4EC] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <ToastContainer />

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800"
                placeholder="Username"
              />
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800"
                placeholder="Phone number"
              />
              {/* Profile image upload intentionally omitted to avoid backend filename issues; keep default image for now */}
            </div>
            <div className="flex justify-end gap-3 mt-6 flex-wrap">
              <Button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-emerald-400 text-black px-4 py-2 rounded-xl font-semibold hover:bg-emerald-500 transition"
                onClick={handleSave}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-md p-8 mb-10 flex flex-col items-center text-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#CFE8D5] shadow-md mb-4">
          <Image
            src={profileImage}
            alt="Profile Image"
            width={128}
            height={128}
            className="object-cover w-full h-full"
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-800">{username || 'Username'}</h1>
        <p className="text-gray-600 mt-1">{phoneNumber || 'Phone number'}</p>

        <div className="mt-6 bg-[#F9FAF8] rounded-2xl shadow-inner px-6 py-4 w-full flex justify-around">
          <div>
            <p className="text-xl font-bold text-gray-900">{offers.length}</p>
            <p className="text-sm text-gray-500">Orders</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">
              {offers.reduce((sum, o) => sum + o.quantity, 0)}
            </p>
            <p className="text-sm text-gray-500">Items Saved</p>
          </div>
        </div>
        <div className="mt-4">
          <Button
            className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-full font-semibold shadow-sm hover:shadow-md"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Offers Section */}
      <section className="w-full max-w-6xl px-4">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Your Past Orders
        </h2>

        {loading ? (
          <p className="text-gray-600 text-center">Loading offers...</p>
        ) : offers.length === 0 ? (
          <div className="text-center text-gray-600">
            <p className="text-lg mb-4">You haven’t placed any orders yet.</p>
            <Button className="bg-gradient-to-r from-emerald-400 to-green-300 text-gray-900 px-6 py-2 rounded-full font-semibold shadow hover:shadow-lg transform transition-all hover:-translate-y-0.5">
              Explore Offers
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 overflow-hidden"
              >
                <div className="w-full h-48 relative">
                  <Image
                    src={
                      offer.images?.[0]?.path
                        ? `${BASE_IMAGE_URL}${offer.images[0].path}`
                        : DEFAULT_PROFILE_IMAGE
                    }
                    alt={offer.title}
                    fill
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">
                    Pickup: {offer.pickupLocation}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expired on{' '}
                    {new Date(offer.expirationDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="p-4 flex justify-between items-center">
                  <span className="bg-[#DFF6E5] text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {offer.quantity} items
                  </span>
                  <Button className="bg-white border border-gray-300 text-gray-700 px-4 py-1 rounded-full font-medium hover:bg-gray-50 transition">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
