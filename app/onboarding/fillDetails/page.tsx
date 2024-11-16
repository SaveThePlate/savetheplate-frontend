"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useIsClient } from "usehooks-ts";

const FillDetails = () => {
  const isClient = useIsClient();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [zoom] = useState(13);

  const extractLocationData = (googleMapsUrl: string) => {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = googleMapsUrl.match(regex);
    const latitude = match ? parseFloat(match[1]) : null;
    const longitude = match ? parseFloat(match[2]) : null;
    const nameRegex = /maps\/place\/([^/@]+)/;
    const nameMatch = googleMapsUrl.match(nameRegex);
    const locationName = nameMatch
      ? decodeURIComponent(nameMatch[1]).replace(/\+/g, " ")
      : "";

    return { latitude, longitude, locationName };
  };

  const handleProfileUpdate = async () => {
    const { latitude, longitude, locationName } =
      extractLocationData(googleMapsLink);
    if (!latitude || !longitude || !locationName) {
      toast.error("Invalid Google Maps link!");
      return;
    }

    const data = {
      location: locationName,
      phoneNumber: +phoneNumber,
      latitude,
      longitude,
      googleMapsLink
    };

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;
      if (!token) {
        toast.error("No access token found.");
        return;
      }

      const response = await axios.put(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/users/update-details",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        toast.success("Restaurant details added successfully!");
        router.push("/provider/home");
      } else {
        toast.error("Failed to add restaurant details. Please try again.");
      }
    } catch (error) {
      console.error("Error adding restaurant details:", error);
      toast.error("An error occurred while adding the restaurant.");
    }
  };

  const handleGoogleMapsLinkChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const url = e.target.value;
    setGoogleMapsLink(url);
    const { latitude, longitude, locationName } = extractLocationData(url);
    setLatitude(latitude);
    setLongitude(longitude);
    setLocation(locationName || "");

    if (latitude && longitude) {
      setCoordinates({ latitude, longitude });
    }
  };

  return (
    <div
      className="bg-[#98cca8] min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8">
      <div className="relative flex flex-col items-center justify-center text-center w-full max-w-md px-4 py-12 bg-white rounded-3xl shadow-lg">
        <ToastContainer />
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <h1
            className="text-3xl font-extrabold mb-4"
            style={{
              color: "#ffbe98",
              WebkitTextStroke: "0.6px #000000",
              textShadow: "4px 4px 6px rgba(0, 0, 0, 0.15)",
            }}
          >
            Add Your Restaurant Details
          </h1>
          <p
            className="text-base font-semibold mb-6"
            style={{
              color: "#333333",
              textShadow: "1px 1px 3px rgba(0, 0, 0, 0.3)",
            }}
          >
            Help customers find your location and get in touch with you!
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProfileUpdate();
          }}
          className="space-y-4 w-full"
        >
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Phone Number"
            required
          />
          <Input
            id="googleMapsLink"
            value={googleMapsLink}
            onChange={handleGoogleMapsLinkChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Google Maps Link"
            required
          />
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Restaurant Name will be scraped from Google Maps"
            disabled
          />
          <Button
            type="submit"
            className="w-full bg-[#fffc5ed3] text-black font-bold py-2 rounded-full border border-black shadow-lg transform transition-transform hover:scale-105 hover:bg-yellow-300"
          >
            Submit Details
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FillDetails;
