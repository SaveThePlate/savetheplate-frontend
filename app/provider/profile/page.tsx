'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Offer {
  id: number;
  title: string;
  images: { path: string }[];
  expirationDate: string;
  pickupLocation: string;
  quantity: number;
  description?: string;
  price?: number;
}

const DEFAULT_PROFILE_IMAGE = "/logo.png";
const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    username: "",
    location: "",
    phoneNumber: "",
    profileImage: DEFAULT_PROFILE_IMAGE,
  });
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOfferEditModalOpen, setIsOfferEditModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offerForm, setOfferForm] = useState({
    title: "",
    description: "",
    price: "",
    quantity: "",
    expirationDate: "",
  });

  useEffect(() => {
    const fetchProfileAndOffers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) throw new Error('Token missing');

        const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { username, location, phoneNumber, profileImage } = profileRes.data || {};
        setFormData({
          username: username || 'Username',
          location: location || 'Location',
          phoneNumber: phoneNumber || 'Phone number',
          profileImage: profileImage || DEFAULT_PROFILE_IMAGE,
        });

        const id = JSON.parse(atob(token.split('.')[1])).id;
        const offersRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOffers(offersRes.data);
      } catch (err: any) {
        console.error(err.response?.data || err.message);
        toast.error('Failed to fetch profile or offers');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndOffers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openOfferEditModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description ?? "",
      price: String((offer as any).price ?? ""),
      quantity: String(offer.quantity ?? ""),
      expirationDate: offer.expirationDate ? new Date(offer.expirationDate).toISOString().slice(0,16) : "",
    });
    setIsOfferEditModalOpen(true);
  };

  const handleOfferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOfferForm(prev => ({ ...prev, [name]: value }));
  };

  const handleOfferSave = async () => {
    if (!selectedOffer) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token missing");

      const payload = {
        title: offerForm.title,
        description: offerForm.description,
        price: parseFloat(offerForm.price),
        quantity: parseInt(offerForm.quantity || "0", 10),
        expirationDate: new Date(offerForm.expirationDate).toISOString(),
      };

      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${selectedOffer.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // update local offers list
      setOffers(prev => prev.map(o => o.id === selectedOffer.id ? { ...o, ...payload } as Offer : o));
      setIsOfferEditModalOpen(false);
      toast.success("Offer updated successfully!");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error("Failed to update offer.");
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token missing");

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          username: formData.username,
          location: formData.location,
          phoneNumber: formData.phoneNumber,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsEditModalOpen(false);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error(err.response?.data || err.message);
      toast.error("Failed to update profile.");
    }
  };

  const totalOffers = offers.length;
  const totalQuantity = offers.reduce((sum, o) => sum + o.quantity, 0);
      

  return (
    <main className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <ToastContainer />

      {/* Offer Edit Modal */}
      {isOfferEditModalOpen && selectedOffer && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Offer</h2>
            <div className="space-y-4">
              <input
                name="title"
                value={offerForm.title}
                onChange={handleOfferFormChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                placeholder="Title"
              />
              <textarea
                name="description"
                value={offerForm.description}
                onChange={handleOfferFormChange}
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                placeholder="Description"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  value={offerForm.price}
                  onChange={handleOfferFormChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                  placeholder="Price"
                />
                <input
                  name="quantity"
                  type="number"
                  value={offerForm.quantity}
                  onChange={handleOfferFormChange}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                  placeholder="Quantity"
                />
              </div>
              <input
                name="expirationDate"
                type="datetime-local"
                value={offerForm.expirationDate}
                onChange={handleOfferFormChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
              />
            </div>
            <div className="flex justify-end gap-3 mt-6 flex-wrap">
              <Button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition"
                onClick={() => setIsOfferEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold hover:bg-yellow-500 transition"
                onClick={async () => {
                  // basic validation
                  if (!offerForm.title || offerForm.title.trim() === "") {
                    toast.error("Title is required");
                    return;
                  }
                  if (offerForm.price && isNaN(Number(offerForm.price))) {
                    toast.error("Price must be a number");
                    return;
                  }
                  await handleOfferSave();
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 mb-10 flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#f9f7f1] shadow-md mb-4">
          <Image
            src={formData.profileImage}
            alt="Profile Image"
            width={128}
            height={128}
            className="object-cover w-full h-full"
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{formData.username}</h1>
        <p className="text-gray-600 mb-1">{formData.phoneNumber}</p>
        <p className="text-gray-500 mb-4">{formData.location}</p>

        {/* Stats */}
        <div className="flex justify-around w-full px-6 mb-6 text-center bg-[#f9f7f1] rounded-2xl py-3 shadow-inner">
          <div>
            <p className="text-xl font-bold text-gray-900">{totalOffers}</p>
            <p className="text-sm text-gray-500">Offers</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{totalQuantity}</p>
            <p className="text-sm text-gray-500">Items</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 mt-2 justify-center w-full">
          <Link href="/provider/publish">
            <Button className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 px-6 py-2 rounded-full font-semibold shadow hover:shadow-lg transform transition-all hover:-translate-y-0.5">
              Add Offer
            </Button>
          </Link>
          <Button
            className="bg-white border border-gray-300 text-gray-800 px-6 py-2 rounded-full font-semibold shadow-sm hover:shadow-md transform transition-all hover:-translate-y-0.5 hover:bg-gray-50"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>

        </div>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 overflow-auto">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h2>
              <div className="space-y-4">
                {['username','location','phoneNumber'].map(field => (
                  <input
                    key={field}
                    type="text"
                    name={field}
                    value={formData[field as keyof typeof formData]}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6 flex-wrap">
                <Button
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-yellow-400 text-black px-4 py-2 rounded-xl font-semibold hover:bg-yellow-500 transition"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>


{/* Offers Section */}
<div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
  {loading ? (
    <p className="text-gray-600 text-center col-span-full">Loading offers...</p>
  ) : offers.length === 0 ? (
    <p className="text-gray-600 text-center col-span-full">No offers yet.</p>
  ) : (
    offers.map((offer) => (
      <div
        key={offer.id}
        className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow transform hover:-translate-y-1"
      >
        {/* Image */}
        <div className="w-full h-48 relative">
          <Image
            src={offer.images?.[0]?.path ? `${BASE_IMAGE_URL}${offer.images[0].path}` : DEFAULT_PROFILE_IMAGE}
            alt={offer.title}
            fill
            className="object-cover w-full h-full"
          />
        </div>

        {/* Info */}
        <div className="p-4 flex flex-col gap-1">
          <h2 className="text-lg font-bold text-gray-900 truncate">{offer.title}</h2>
          <p className="text-sm text-gray-500 truncate">Pickup: {offer.pickupLocation}</p>
          <p className="text-sm text-gray-500">
            Expires: {new Date(offer.expirationDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </p>
        </div>

        {/* Quantity */}
        <div className="px-4 pb-4 text-gray-900 font-bold">{offer.quantity} left</div>
        <div className="px-4 pb-4 flex justify-end">
          <Button
            onClick={() => openOfferEditModal(offer)}
            className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded-xl font-medium hover:bg-gray-50"
          >
            Edit
          </Button>
        </div>
      </div>
    ))
  )}
</div>


    </main>
  );
}
