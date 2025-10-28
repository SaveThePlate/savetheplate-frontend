"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Token missing");

        const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { username, location, phoneNumber, profileImage } = profileRes.data || {};
        setFormData({
          username: username || "Username",
          location: location || "Location",
          phoneNumber: phoneNumber || "Phone number",
          profileImage: profileImage || DEFAULT_PROFILE_IMAGE,
        });

        const id = JSON.parse(atob(token.split(".")[1])).id;
        const offersRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOffers(offersRes.data);
      } catch (err: any) {
        console.error(err.response?.data || err.message);
        toast.error("Failed to fetch profile or offers");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndOffers();
  }, []);

  const totalOffers = offers.length;
  const totalQuantity = offers.reduce((sum, o) => sum + o.quantity, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOfferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setOfferForm(prev => ({ ...prev, [name]: value }));
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

  const handleOfferSave = async () => {
    if (!selectedOffer) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token missing");

      const quantity = Number(offerForm.quantity);
      if (isNaN(quantity) || quantity < 0) {
        toast.error("Quantity must be a valid number greater than or equal to 0");
        return;
      }

      const price = parseFloat(offerForm.price);
      if (isNaN(price) || price < 0) {
        toast.error("Price must be a valid number greater than or equal to 0");
        return;
      }

      const payload = {
        title: offerForm.title.trim() || selectedOffer.title,
        description: offerForm.description.trim() || selectedOffer.description || "",
        price,
        quantity,
        expirationDate: offerForm.expirationDate
          ? new Date(offerForm.expirationDate).toISOString()
          : selectedOffer.expirationDate,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${selectedOffer.id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOffers(prev =>
        prev.map(o => o.id === selectedOffer.id ? { ...o, ...payload } : o)
      );

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

  return (
    <main className="bg-[#e8f4ee] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <ToastContainer />

      {/* Profile Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 mb-10 flex flex-col items-center">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#d0f0e0] shadow-md mb-4">
          <Image
            src={formData.profileImage}
            alt="Profile Image"
            width={112}
            height={112}
            className="object-cover w-full h-full"
          />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-green-900">{formData.username}</h1>
        <p className="text-gray-600 mb-1">{formData.phoneNumber}</p>
        <p className="text-gray-500 mb-4">{formData.location}</p>

        {/* Stats */}
        <div className="flex justify-around w-full px-4 mb-6 text-center bg-[#dff3e8] rounded-2xl py-3 shadow-inner">
          <div>
            <p className="text-lg font-bold text-green-900">{totalOffers}</p>
            <p className="text-sm text-gray-500">Offers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-green-900">{totalQuantity}</p>
            <p className="text-sm text-gray-500">Items</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-2 justify-center w-full">
          <Link href="/provider/publish">
            <Button className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 px-5 py-2 rounded-full font-semibold shadow hover:shadow-lg transition hover:-translate-y-0.5">
              Add Offer
            </Button>
          </Link>
          <Button
            className="bg-white border border-gray-300 text-gray-800 px-5 py-2 rounded-full font-semibold shadow-sm hover:shadow-md transition hover:-translate-y-0.5 hover:bg-gray-50"
            onClick={() => setIsEditModalOpen(true)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Offers Section */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <p className="text-gray-600 text-center col-span-full mt-10">Loading offers...</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-center col-span-full mt-10">No offers yet.</p>
        ) : (
          offers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow transform hover:-translate-y-1"
            >
              <div className="w-full h-40 relative">
                <Image
                  src={offer.images?.[0]?.path ? `${BASE_IMAGE_URL}${offer.images[0].path}` : DEFAULT_PROFILE_IMAGE}
                  alt={offer.title}
                  fill
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4 flex flex-col gap-1">
                <h2 className="text-md font-bold text-green-900 truncate">{offer.title}</h2>
                <p className="text-sm text-gray-500 truncate">Pickup: {offer.pickupLocation}</p>
                <p className="text-sm text-gray-500">
                  Expires: {new Date(offer.expirationDate).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                </p>
              </div>
              <div className="px-4 pb-4 flex justify-between items-center">
                <span className="text-green-800 font-bold">{offer.quantity} left</span>
                <span className="text-green-800 font-bold">{offer.price} dt</span>

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

{/* Profile Edit Modal */}
{isEditModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4 overflow-auto">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        onClick={() => setIsEditModalOpen(false)}
      >
        ×
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Edit Profile</h2>

      <div className="space-y-4">
        {["username", "location", "phoneNumber"].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            value={formData[field as keyof typeof formData]}
            onChange={handleInputChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          />
        ))}
      </div>

      <div className="flex justify-end gap-3 mt-6 flex-wrap">
        <Button
          className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300 transition"
          onClick={() => setIsEditModalOpen(false)}
        >
          Cancel
        </Button>
        <Button
          className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
          onClick={handleSave}
        >
          Save
        </Button>
      </div>
    </div>
  </div>
)}


{/* Offer Edit Modal */}
{isOfferEditModalOpen && selectedOffer && (
  <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 p-4 overflow-auto">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative">
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl font-bold"
        onClick={() => setIsOfferEditModalOpen(false)}
      >
        ×
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Edit Offer</h2>

      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            name="title"
            value={offerForm.title}
            onChange={handleOfferFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
            placeholder="Title"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={offerForm.description}
            onChange={handleOfferFormChange}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
            placeholder="Description"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              name="price"
              type="number"
              step="0.01"
              value={offerForm.price}
              onChange={handleOfferFormChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
              placeholder="Price"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              name="quantity"
              type="number"
              value={offerForm.quantity}
              onChange={handleOfferFormChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
              placeholder="Quantity"
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
          <input
            name="expirationDate"
            type="datetime-local"
            value={offerForm.expirationDate}
            onChange={handleOfferFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none text-gray-800"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 mt-6 flex-wrap">
        <Button
          className="bg-gray-200 text-gray-800 px-5 py-2 rounded-lg hover:bg-gray-300 transition"
          onClick={() => setIsOfferEditModalOpen(false)}
        >
          Cancel
        </Button>
        <Button
          className="bg-yellow-400 text-black px-5 py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
          onClick={async () => {
            if (!offerForm.title.trim()) {
              toast.error("Title is required");
              return;
            }
            if (offerForm.price && isNaN(Number(offerForm.price))) {
              toast.error("Price must be a number");
              return;
            }
            if (offerForm.quantity && isNaN(Number(offerForm.quantity))) {
              toast.error("Quantity must be a number");
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

    </main>
  );
}
