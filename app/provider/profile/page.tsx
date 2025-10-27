"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const DEFAULT_PROFILE_IMAGE = "/logo.png";

export default function ProfilePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    location: "",
    phoneNumber: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { username, location, phoneNumber } = response.data || {};
        setFormData({
          username: username || "Username",
          location: location || "Location",
          phoneNumber: phoneNumber || "Phone number",
        });
      } catch (err) {
        // non-fatal: keep defaults
      }
    })();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
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
    } catch (error) {
      toast.error("Failed to update profile.");
    }
  };

  return (
    <main className="sm:pt-16 p-6 bg-[#cdeddf] min-h-screen flex flex-col items-center justify-center">
      <ToastContainer />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
            <Image
              src={DEFAULT_PROFILE_IMAGE}
              alt="Profile"
              width={96}
              height={96}
              className="object-cover w-full h-full"
            />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-800">{formData.username}</h1>
            <h2 className="text-gray-600 text-sm">{formData.location}</h2>
            <p className="text-gray-600 text-sm">{formData.phoneNumber}</p>
          </div>
        </div>

        <div className="w-full h-40 bg-yellow-300 rounded-lg mt-4 flex items-center justify-center">
          <span className="text-gray-700">Map Placeholder</span>
        </div>

        <Button
          className="mt-6 text-black bg-[#fffc5ed3] sm:text-lg border border-black font-bold py-2 px-6 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-105 hover:bg-yellow-600"
          onClick={() => setIsEditModalOpen(true)}
        >
          Edit Profile
        </Button>

        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full p-2 mb-2 border rounded"
                placeholder="Username"
              />
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 mb-2 border rounded"
                placeholder="Location"
              />
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full p-2 mb-4 border rounded"
                placeholder="Phone Number"
              />
              <div className="flex justify-end gap-2">
                <Button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSave}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
