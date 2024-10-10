"use client";
import React, { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

  useEffect(() => {
    if (radius < 1000) setZoom(15);
    else if (radius < 3000) setZoom(14);
    else setZoom(13);
  }, [radius]);

  const formatDate = (date: Date) => date.toLocaleDateString();
  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
              <div className="text-sm">
                <strong className="block mb-1">{offer.title}</strong>
                <strong>Owner:</strong> {offer.owner} <br />
                <strong>Pickup Location:</strong> {offer.pickupLocation} <br />
                <strong>Expires:</strong>{" "}
                {formatDate(new Date(offer.expirationDate))} at{" "}
                {formatTime(new Date(offer.expirationDate))} <br />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
