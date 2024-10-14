"use client";
import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";

interface Offer {
  id: number;
  owner: string;
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
}

const emojiIcon = new L.DivIcon({
  html: '<div style="font-size: 30px;">🥡</div>',
  className: "",
  iconSize: [30, 30], 
  iconAnchor: [15, 30],
});

const userLocationIcon = new L.DivIcon({
  html: '<div style="font-size: 30px;">👦🏻</div>',
  className: "",
  iconSize: [30, 30], 
  iconAnchor: [15, 30],
});

const LeafletMap = ({ markers, center }: any) => {
  const [radius, setRadius] = useState(1000);
  const [zoom, setZoom] = useState(13);

  const router = useRouter();
  const params = useParams();  
  
  const { id } = params;

  const [offer, setOffer] = useState<Offer | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [inCart, setInCart] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("No access token found, please log in again.");
        return router.push("/signIn");
      }
      const { id } = params;
      console.log("id ", id);

      axios.get(`http://localhost:3001/offers/${id}`, { 
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(response => {
        console.log('response.data ',response.data);
        if (response.data) setOffer(response.data);
        console.log("offer ", offer);
      })
    };
    
    fetchOffer();
  }, [params.id]);

  

  useEffect(() => {
    if (radius < 1000) setZoom(15);
    else if (radius < 3000) setZoom(14);
    else setZoom(13);
  }, [radius]);

  const formatDate = (date: Date) => date.toLocaleDateString();
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });


  const BASE_IMAGE_URL = "http://localhost:3001/storage/";
  const getImage = (filename: string): string => {
    return filename ? `${BASE_IMAGE_URL}${filename}` : "";
  };

  const handleOrder = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("You need to be logged in to place an order.");
        return;
      }
  
      const response = await axios.post(
        "http://localhost:3001/orders",
        { userId: userId, offerId: offer?.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setInCart(true);
      toast.success("Your order is successful");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Error in placing order");
    }
  };
  

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <h1 className="text-xl font-semibold text-gray-700">
        View all the available offers around you!
      </h1>

      <div className="mb-4">
        <label htmlFor="radius" className="block font-medium text-gray-700 mb-2">
          Adjust Search Radius (meters):
        </label>
        <input
          type="range"
          id="radius"
          name="radius"
          min="100"
          max="5000"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm text-gray-600 mt-1 block text-center">
          {radius} meters
        </span>
      </div>

      <MapContainer
        center={center}
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Radius Circle */}
        <Circle
          center={center}
          radius={radius}
          pathOptions={{ color: "blue", fillColor: "lightblue", fillOpacity: 0.4 }}
        />

        {/* User Location Marker */}
        <Marker position={center} icon={userLocationIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Offer Markers */}
        {markers?.map((offer: any) => (
          <Marker
            key={offer.id}
            position={[offer.latitude, offer.longitude]}
            icon={emojiIcon}
          >
      <Popup>
        <div className="flex items-center p-4 bg-white rounded-lg shadow-md text-sm space-x-4">

          {/* Left Side: Offer Details */}
          <div className="flex-1">
            <strong className="block mb-2 text-lg text-gray-800 font-semibold">
              {offer.title}
            </strong>
            <div className="text-gray-600">
              <div className="mb-1">
                <strong className="text-gray-700">Pickup Location:</strong> {offer.pickupLocation}
              </div>
              <div className="mb-1">
                <strong className="text-gray-700">Expires:</strong> {formatDate(new Date(offer.expirationDate))} at {formatTime(new Date(offer.expirationDate))}
              </div>
            </div>
          </div>

          {/* Right Side: Image and Button */}
          <div className="flex flex-col items-center space-y-2">
            <div className="w-24 h-24">
              <img
                className="w-full h-full object-cover rounded-md border border-gray-200"
                src={offer.images.length > 0 ? getImage(offer.images[0].path) : '/default-placeholder.png'}
                alt={offer.title}
              />
            </div>

            <button
              onClick={handleOrder}
              className={`py-2 px-6 rounded-md text-white w-full ${inCart ? "bg-green-600" : "bg-blue-600"}`}
            >
              {inCart ? "Added to Cart" : "Add to Cart"}
            </button>
          </div>
        </div>
      </Popup>




          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
