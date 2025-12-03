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

      const normalizedPhone = phoneNumber.trim();
      if (!/^\d{8}$/.test(normalizedPhone)) {
        toast.error("Please enter a valid phone number (8 digits).");
        return;
      }

      const data = {
        phoneNumber: normalizedPhone,
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

      toast.success("Details submitted successfully!");
      router.push("/onboarding/thank-you");
    } catch (error) {
      console.error("Error adding restaurant details:", error);
      toast.error("An error occurred while adding the restaurant.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6">
      <div className="relative w-full max-w-2xl">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#FFD6C9] blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-16 -right-6 w-40 h-40 rounded-full bg-[#C8E3F8] blur-3xl opacity-60" />

        <div className="relative z-10 w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-[#f5eae0] px-6 py-8 sm:px-10 sm:py-10">
          <ToastContainer
            position="top-right"
            autoClose={1000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            limit={3}
            toastClassName="bg-emerald-600 text-white rounded-xl shadow-lg border-0 px-4 py-3"
            bodyClassName="text-sm font-medium"
            progressClassName="bg-white/80"
          />

          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600">
              Step 2 of 2
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#344E41]">
              Add your <span className="text-[#FFAE8A]">location</span> details
            </h1>
            <p className="text-gray-700 text-sm sm:text-base max-w-md mx-auto">
              Help customers find you easily and contact you if needed 🌿
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProfileUpdate();
            }}
            className="grid grid-cols-1 gap-5 text-left"
          >
            <div className="space-y-1">
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Phone number
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#A8DADC] focus:border-[#A8DADC]"
                placeholder="+216 ..."
                required
              />
              <p className="text-xs text-gray-500">
                Used by customers to reach you about their surprise bags.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="googleMapsLink"
                className="block text-sm font-medium text-gray-700"
              >
                Google Maps link
              </label>
              <Input
                id="googleMapsLink"
                value={mapsLink}
                onChange={handleGoogleMapsLinkChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#FFAE8A] focus:border-[#FFAE8A]"
                placeholder="Paste your Google Maps location URL"
                required
              />
              <p className="text-xs text-gray-500">
                Copy the link from Google Maps and paste it here so we can guide clients to you.
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                Detected place name
              </label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                placeholder="Will be auto-filled from your Google Maps link"
                disabled
              />
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-[#A8DADC] hover:bg-[#92C7C9] text-[#1D3557] font-semibold py-3 rounded-full transition-all duration-300 shadow-sm"
            >
              Submit details
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FillDetails;
