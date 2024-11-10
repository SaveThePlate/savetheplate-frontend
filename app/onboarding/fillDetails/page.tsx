"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useIsClient } from "usehooks-ts";
// import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

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

    // Update coordinates state for the map center
    if (latitude && longitude) {
      setCoordinates({ latitude, longitude });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 via-green-300 to-green-200 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <ToastContainer />
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <h1 className="font-bold text-2xl text-green-900">
            Add Your Restaurant Details
          </h1>
          <p className="font-light text-sm text-gray-600">
            Help customers find your location and get in touch with you!
          </p>
        </div>




        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleProfileUpdate();
          }}
          className="space-y-4"
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
            placeholder="Restaurant Name (scraped from Google Maps)"
            disabled
          />
          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
          >
            Submit Details
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FillDetails;
