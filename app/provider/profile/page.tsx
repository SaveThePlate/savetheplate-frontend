"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export default function ProviderProfile() {
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

  // Fetch profile + offers
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleOfferFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setOfferForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const openOfferEditModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setOfferForm({
      title: offer.title,
      description: offer.description ?? "",
      price: String(offer.price ?? ""),
      quantity: String(offer.quantity ?? ""),
      expirationDate: offer.expirationDate
        ? new Date(offer.expirationDate).toISOString().slice(0, 16)
        : "",
    });
    setIsOfferEditModalOpen(true);
  };

  const handleOfferSave = async () => {
    if (!selectedOffer) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token missing");

      const payload = {
        title: offerForm.title.trim() || selectedOffer.title,
        description: offerForm.description.trim() || selectedOffer.description || "",
        price: parseFloat(offerForm.price) || 0,
        quantity: Number(offerForm.quantity) || 0,
        expirationDate: offerForm.expirationDate
          ? new Date(offerForm.expirationDate).toISOString()
          : selectedOffer.expirationDate,
      };

      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${selectedOffer.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOffers(prev => prev.map(o => (o.id === selectedOffer.id ? { ...o, ...payload } : o)));
      setIsOfferEditModalOpen(false);
      toast.success("Offer updated successfully!");
    } catch {
      toast.error("Failed to update offer.");
    }
  };

  const handleDeleteOffer = async (id: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token missing");

      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOffers(prev => prev.filter(o => o.id !== id));
      toast.success("Offer deleted successfully!");
    } catch {
      toast.error("Failed to delete offer.");
    }
  };

  return (
    <main className="bg-[#F9FAF5] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <ToastContainer />
      {/* Profile Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 mb-12 flex flex-col items-center text-center">
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#E5F3E9] mb-4 shadow-md">
          <Image
            src={formData.profileImage}
            alt="Profile"
            width={112}
            height={112}
            className="object-cover w-full h-full"
          />
        </div>
        <h1 className="text-2xl font-bold text-[#1B4332]">{formData.username}</h1>
        <p className="text-gray-600">{formData.phoneNumber}</p>
        <p className="text-gray-500 mb-4">{formData.location}</p>

        <div className="flex justify-around w-full bg-[#F3F7F0] rounded-2xl py-3 mb-6">
          <div>
            <p className="text-lg font-bold text-[#1B4332]">{totalOffers}</p>
            <p className="text-sm text-gray-500">Offers</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[#1B4332]">{totalQuantity}</p>
            <p className="text-sm text-gray-500">Items</p>
          </div>
        </div>

        <div className="flex gap-3 mt-2">
          <Link href="/provider/publish">
            <Button className="bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 px-5 py-2 rounded-full font-semibold shadow hover:shadow-md transition hover:-translate-y-0.5">
              Add Offer
            </Button>
          </Link>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-800 px-5 py-2 rounded-full font-semibold hover:bg-gray-50 transition"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Offers */}
      <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-600 text-center col-span-full mt-10">Loading offers...</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-center col-span-full mt-10">No offers yet.</p>
        ) : (
          offers.map(offer => {
            const expired = new Date(offer.expirationDate) < new Date();
            return (
              <div
                key={offer.id}
                className="bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-lg transition"
              >
                <div className="w-full h-40 relative">
                  <Image
                    src={offer.images?.[0]?.path ? `${BASE_IMAGE_URL}${offer.images[0].path}` : DEFAULT_PROFILE_IMAGE}
                    alt={offer.title}
                    fill
                    className="object-cover"
                  />
                  {expired && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow">
                      Expired
                    </Badge>
                  )}
                </div>
                <div className="p-5 flex flex-col gap-2">
                  <h2 className="text-lg font-semibold text-[#1B4332] truncate">{offer.title}</h2>
                  <p className="text-sm text-gray-600 truncate">
                    Pickup: {offer.pickupLocation}
                  </p>
                  <p className="text-sm text-gray-500">
                    Expires:{" "}
                    {new Date(offer.expirationDate).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </p>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[#2D6A4F] font-semibold">{offer.quantity} left</span>
                    <span className="text-[#2D6A4F] font-semibold">{offer.price} dt</span>
                  </div>

                  <div className="flex gap-2 mt-4 justify-end">
                    <Button
                      onClick={() => openOfferEditModal(offer)}
                      className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded-full font-medium hover:bg-gray-50"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-full font-medium hover:bg-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* (Modals stay same — edit profile and offer) */}
      {/* ... keep your modal code unchanged ... */}
    </main>
  );
}
