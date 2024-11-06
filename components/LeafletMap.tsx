import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

interface Offer {
  id: number;
  owner: string;
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  latitude: number;
  longitude: number;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("No access token found, please log in again.");
        router.push("/signIn");
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3001/offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data) {
          setOffer(response.data);
        }
      } catch (error) {
        console.error("Error fetching offer:", error);
        setError("Failed to fetch the offer");
      }
    };

    fetchOffer();
  }, [id, router]);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("No access token found, please log in again.");
        router.push("/signIn");
        return;
      }

      try {
        const response = await axios.get("http://localhost:3001/users/get-role", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setUserRole(response.data.role); // Set the user role
        } else {
          console.error("Failed to fetch user role:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setError("Failed to fetch user role");
      }
    };

    fetchUserRole();
  }, [router]);

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
    return filename ? `${BASE_IMAGE_URL}${filename}` : "/default-placeholder.png";
  };

  const handleOrder = async (offerId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("You need to be logged in to place an order.");
        return;
      }

      await axios.post(
        "http://localhost:3001/orders",
        { userId, offerId, quantity },
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

        <Circle
          center={center}
          radius={radius}
          pathOptions={{ color: "blue", fillColor: "lightblue", fillOpacity: 0.4 }}
        />

        <Marker position={center} icon={userLocationIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {markers?.map((offer: Offer) => (
          <Marker
            key={offer.id}
            position={[offer.latitude, offer.longitude]}
            icon={emojiIcon}
          >
            <Popup>
              <div className="flex items-center p-4 bg-white rounded-lg shadow-md text-sm space-x-4">
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

                <div className="flex flex-col items-center space-y-2">
                  <div className="w-24 h-24">
                    <Image
                      className="w-full h-full object-cover rounded-md border border-gray-200"
                      src={getImage(offer.images[0]?.path || "/default-placeholder.png")}
                      alt={offer.title}
                      width={96}
                      height={96}
                    />
                  </div>

                  {userRole === "client" && ( 
                    <button
                      onClick={() => handleOrder(offer.id)}
                      className={`py-2 px-6 rounded-md text-white w-full ${inCart ? "bg-green-600" : "bg-blue-600"}`}
                    >
                      {inCart ? "Added to Cart" : "Add to Cart"}
                    </button>
                  )}
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
