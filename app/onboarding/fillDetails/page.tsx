"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const FillDetails = () => {
  const router = useRouter();
  const [location, setLocation] = useState(""); // extracted restaurant name
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mapsLink, setMapsLink] = useState("");

  // --- Extract location name for preview
  const fetchLocationName = async (url: string) => {
    if (!url.trim()) {
      setLocation("");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || "";
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/extract-location`,
        { mapsLink: url },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { locationName } = response.data;
      setLocation(locationName || "");
    } catch (error) {
      console.error("Error extracting location name:", error);
      setLocation("");
    }
  };

  const handleGoogleMapsLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMapsLink(url);
    fetchLocationName(url);
  };

  const handleProfileUpdate = async () => {
    try {
      if (!mapsLink.trim()) {
        toast.error("Please provide a Google Maps link.");
        return;
      }

      if (!phoneNumber.trim() || isNaN(parseInt(phoneNumber.trim()))) {
        toast.error("Please enter a valid phone number.");
        return;
      }

      const data = {
        phoneNumber: phoneNumber.trim(),
        mapsLink: mapsLink.trim(),
      };

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/update-details`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Restaurant details added successfully!");
      router.push("/provider/home");
    } catch (error) {
      console.error("Error adding restaurant details:", error);
      toast.error("An error occurred while adding the restaurant.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-6">
      <div className="relative z-10 w-full max-w-md text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-md px-8 py-10 border border-[#f5eae0]">
        <ToastContainer />

        <h1 className="text-3xl font-extrabold text-[#344E41] mb-2">
          Add Your <span className="text-[#FFAE8A]">Restaurant Details</span>
        </h1>

        <p className="text-gray-700 text-base font-medium mb-8">
          Help customers find your location and contact you easily 🌿
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProfileUpdate();
          }}
          className="space-y-4 text-left"
        >
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#A8DADC] focus:border-[#A8DADC]"
            placeholder="Phone Number"
            required
          />

          <Input
            id="googleMapsLink"
            value={mapsLink}
            onChange={handleGoogleMapsLinkChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#FFAE8A] focus:border-[#FFAE8A]"
            placeholder="Google Maps Link"
            required
          />

          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
            placeholder="Restaurant name will be auto-filled"
            disabled
          />

          <Button
            type="submit"
            className="w-full bg-[#A8DADC] hover:bg-[#92C7C9] text-[#1D3557] font-semibold py-3 rounded-full transition-all duration-300 shadow-sm"
          >
            Submit Details
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FillDetails;
