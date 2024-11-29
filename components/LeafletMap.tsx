import React, { useState, useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Circle,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import OfferCarousel from "./OfferCarousel";
import styles from "./design.module.css"; // Assuming you're using this for additional styling

// Custom Leaflet icons
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

// Main Map Component
const LeafletMap = ({ markers, center }: any) => {
  const { id } = useParams();
  const [radius, setRadius] = useState(1000);
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    setZoom(radius < 1000 ? 15 : radius < 3000 ? 14 : 13);
  }, [radius]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <ToastContainer />
      <h1 className="text-xl font-semibold text-gray-700">
        View all the available offers around you!
      </h1>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{
          height: "500px",
          width: "100%",
          borderRadius: "10px",
          marginBottom: "20px",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={center}
          radius={radius}
          pathOptions={{ color: "blue", fillOpacity: 0.4 }}
        />
        <Marker position={center} icon={userLocationIcon}>
          <Popup>You are here</Popup>
        </Marker>
        {markers.map((shop: any) => (
          <Marker
            key={shop.id}
            position={[shop.latitude, shop.longitude]}
            icon={emojiIcon}
          >
            <Popup
              maxWidth={400}
              className="popupCustom" // Custom CSS class
            >
              <div className="popupCustomContent">
                <OfferCarousel ownerId={shop.id} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
