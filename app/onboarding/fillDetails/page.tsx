"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic"; // Dynamic import for client-side only rendering
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false });

const restaurantIcon = new L.DivIcon({
  html: '<div style="font-size: 30px;">📍</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const FillDetails = () => {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [zoom, setZoom] = useState(13);

  const extractLocationData = (googleMapsUrl: string) => {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = googleMapsUrl.match(regex);
    const latitude = match ? parseFloat(match[1]) : null;
    const longitude = match ? parseFloat(match[2]) : null;
    const nameRegex = /maps\/place\/([^/@]+)/;
    const nameMatch = googleMapsUrl.match(nameRegex);
    const locationName = nameMatch ? decodeURIComponent(nameMatch[1]).replace(/\+/g, " ") : "";

    return { latitude, longitude, locationName };
  };

  const handleProfileUpdate = async () => {
    const { latitude, longitude, locationName } = extractLocationData(googleMapsLink);
    if (!latitude || !longitude || !locationName) {
      toast.error("Invalid Google Maps link!");
      return;
    }

    const data = { location: locationName, phoneNumber: +phoneNumber, latitude, longitude };

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.put("http://localhost:3001/users/update-details", data, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
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

  const handleGoogleMapsLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setGoogleMapsLink(url);
    const { latitude, longitude, locationName } = extractLocationData(url);
    setLatitude(latitude);
    setLongitude(longitude);
    setLocation(locationName || "");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 via-green-300 to-green-200 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <ToastContainer />
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <h1 className="font-bold text-2xl text-green-900">Add Your Restaurant Details</h1>
          <p className="font-light text-sm text-gray-600">Help customers find your location and get in touch with you!</p>
        </div>

        {latitude && longitude ? (
          <MapContainer
            center={[latitude, longitude]}
            zoom={zoom}
            scrollWheelZoom={true}
            style={{
              height: "200px",
              width: "100%",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              marginBottom: "1rem",
            }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[latitude, longitude]} icon={restaurantIcon}>
              <Popup>{location || "Restaurant location"}</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <p className="text-sm text-gray-500 mb-4">Enter a valid Google Maps link to display the location on the map.</p>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }} className="space-y-4">
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            placeholder="Restaurant Name (scraped from Google Maps)"
            disabled
          />
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
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">
            Submit Details
          </Button>
        </form>
      </div>
    </div>
  );
};

export default FillDetails;
