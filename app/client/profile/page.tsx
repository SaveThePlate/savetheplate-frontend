"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const DEFAULT_PROFILE_IMAGE = "/logo.png";
const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";

const getImage = (filename: string | null) =>
  filename ? `${BASE_IMAGE_URL}${filename}` : DEFAULT_PROFILE_IMAGE;

interface Order {
  id: number;
  quantity: number;
  offerId: number;
  status: string;
  createdAt: string;
}

interface Offer {
  id: number;
  title: string;
  images: { path: string }[];
  pickupLocation: string;
  quantity: number;
}

const ProfilePage = () => {
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ username: "", location: "", phoneNumber: "", profileImage: DEFAULT_PROFILE_IMAGE });
  const [orders, setOrders] = useState<Order[]>([]);
  const [offersDetails, setOffersDetails] = useState<Record<number, Offer>>({});
  const [loading, setLoading] = useState(true);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token not found");

      const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { username, phoneNumber, profileImage, location } = response.data;
      setUsername(username || "");
      setPhoneNumber(phoneNumber || "");
      setProfileImage(profileImage || DEFAULT_PROFILE_IMAGE);
      setFormData({ username: username || "", location: location || "", phoneNumber: phoneNumber || "", profileImage: profileImage || DEFAULT_PROFILE_IMAGE });
    } catch {
      toast.error("Failed to fetch profile");
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token not found");
      const userId = JSON.parse(atob(token.split(".")[1])).id;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(response.data || []);
      for (const order of response.data) {
        const offerRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${order.offerId}`, { headers: { Authorization: `Bearer ${token}` } });
        setOffersDetails((prev) => ({ ...prev, [order.offerId]: offerRes.data }));
      }
    } catch {
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // preview
      setProfileImage(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Token not found");

      const payload = new FormData();
      if (formData.username) payload.append("username", formData.username);
      if (formData.location) payload.append("location", formData.location);
      if (formData.phoneNumber) payload.append("phoneNumber", formData.phoneNumber);
      if (selectedFile) payload.append("profileImage", selectedFile);

      setIsSaving(true);
      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsername(formData.username);
      setPhoneNumber(formData.phoneNumber);
      setIsEditModalOpen(false);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
    fetchOrders();
  }, []);

  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const priority: Record<string, number> = { pending: 0, confirmed: 1, cancelled: 2 };
  const sortedOrders = [...orders].sort((a, b) => {
    const pa = priority[a.status] ?? 99;
    const pb = priority[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <main className="min-h-screen pt-24 pb-20 flex flex-col items-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6 lg:px-16">
      <ToastContainer />

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4 overflow-auto">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Profile</h2>
            <div className="space-y-4">
              <input name="username" value={formData.username} onChange={handleInputChange} placeholder="Username"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800" />
              <input name="location" value={formData.location} onChange={handleInputChange} placeholder="Location"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800" />
              <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Phone number"
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800" />

              <div className="flex items-center gap-3">
                <label className="text-sm text-gray-600">Profile image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 flex-wrap">
              <Button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300 transition" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button className="bg-[#FFAE8A] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#ff9966] transition" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 mb-10 flex flex-col items-center text-center border border-gray-100">
        {pendingCount > 0 && (
          <div className="w-full mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            You have {pendingCount} pending order{pendingCount > 1 ? 's' : ''}. Check <strong>My Purchases</strong> to confirm.
          </div>
        )}
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#CFE8D5] mb-4">
          <Image src={profileImage} alt="Profile" width={128} height={128} className="object-cover w-full h-full" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800">{username || "Username"}</h1>
        <p className="text-gray-600 mt-1">{phoneNumber || "Phone number"}</p>

        <div className="mt-6 bg-white/70 rounded-2xl border border-gray-100 px-4 py-4 w-full grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{orders.length}</p>
            <p className="text-sm text-gray-500">Total Orders</p>
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-600">{orders.filter(o => o.status === 'confirmed').length}</p>
            <p className="text-sm text-gray-500">Confirmed</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-500">{orders.filter(o => o.status === 'cancelled').length}</p>
            <p className="text-sm text-gray-500">Cancelled</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{orders.reduce((sum, o) => sum + (o.quantity || 0), 0)}</p>
            <p className="text-sm text-gray-500">Items Ordered</p>
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-[#FFAE8A] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#ff9966]"
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {/* Orders Section */}
      <section className="w-full max-w-6xl px-4 space-y-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">My Past Orders</h2>

        {loading ? (
          <p className="text-gray-600 text-center">Loading orders...</p>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-600">
            <p className="text-lg mb-4">You haven’t placed any orders yet.</p>
            <Button className="bg-[#FFAE8A] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#ff9966] transition">Explore Offers</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedOrders.map((order) => {
              const offer = offersDetails[order.offerId];
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col transition hover:shadow-md">
                  <div className="relative w-full h-40 bg-gray-100">
                    <Image
                      src={offer?.images?.[0]?.path ? `${BASE_IMAGE_URL}${offer.images[0].path}` : DEFAULT_PROFILE_IMAGE}
                      alt={offer?.title || "Order Image"}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-4 flex flex-col justify-between h-[160px]">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{offer?.title || "Offer"}</h3>
                      <p className="text-sm text-gray-600 mt-1">Pickup: <span className="font-medium text-gray-800">{offer?.pickupLocation || "N/A"}</span></p>
                      <p className="text-sm text-gray-500 mt-1">Ordered on <span className="font-medium text-gray-700">{new Date(order.createdAt).toLocaleDateString()}</span></p>
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full tracking-wide ${
                        order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        order.status === "confirmed" ? "bg-emerald-100 text-emerald-700" :
                        "bg-red-100 text-red-600"
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">{order.quantity} {order.quantity > 1 ? "items" : "item"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
