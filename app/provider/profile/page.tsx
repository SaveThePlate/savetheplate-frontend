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
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const { username, location, phoneNumber } = response.data || {};
        setFormData({
          username: username || "Username",
          location: location || "Location",
          phoneNumber: phoneNumber || "Phone number",
        });
      } catch (err) {
        // Ignore fetch errors, use defaults
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
    <main className="min-h-screen bg-[#cdeddf] flex items-center justify-center p-6 sm:pt-16">
      <ToastContainer />
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 flex flex-col items-center text-center transition-all">
        {/* Profile Image */}
        <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
          <Image
            src={DEFAULT_PROFILE_IMAGE}
            alt="Profile"
            width={112}
            height={112}
            className="object-cover w-full h-full"
          />
        </div>

        {/* User Info */}
        <h1 className="text-2xl font-semibold text-gray-800">
          {formData.username}
        </h1>
        <p className="text-gray-600 mt-1">{formData.location}</p>
        <p className="text-gray-500 text-sm mt-1">{formData.phoneNumber}</p>

        {/* Map placeholder (commented out) */}
        {/*
        <div className="w-full h-40 bg-yellow-300 rounded-lg mt-6 flex items-center justify-center">
          <span className="text-gray-700">Map Placeholder</span>
        </div>
        */}

        {/* Edit Button */}
        <Button
          className="mt-8 bg-[#fffc5ed3] hover:bg-yellow-400 text-black text-sm sm:text-base border border-black font-semibold py-2 px-6 rounded-full shadow-sm hover:shadow-md transition-transform transform hover:scale-105"
          onClick={() => setIsEditModalOpen(true)}
        >
          Edit Profile
        </Button>

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-80 sm:w-96 p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Edit Profile
              </h2>
              <div className="space-y-3">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  placeholder="Username"
                />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  placeholder="Location"
                />
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                  placeholder="Phone Number"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-yellow-400 text-black px-4 py-2 rounded-md font-semibold hover:bg-yellow-500 transition"
                  onClick={handleSave}
                >
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