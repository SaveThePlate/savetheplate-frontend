import React, { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";


const emojiIcon = new L.DivIcon({
  html: '<div style="font-size: 30px;">🥡</div>', 
  className: "",
  iconSize: [1000, 1000],
  iconAnchor: [15, 30],
});

const userLocationIcon = new L.DivIcon({
  html: '<div style="font-size: 30px;">👦🏻</div>', 
  className: "",
  iconSize: [1000, 1000],
  iconAnchor: [15, 30],
});

export function MapComponent({ markers, center }: any) {

  const [radius, setRadius] = useState(1000);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
    <label htmlFor="radius">Adjust Radius (meters):</label>
      <input
        type="range"
        id="radius"
        name="radius"
        min="100"
        max="5000"
        value={radius}
        onChange={(e) => setRadius(Number(e.target.value))}
        style={{ marginBottom: "10px", width: "100%" }}
      />
      <span>{radius} meters</span>

    <MapContainer center={center} zoom={13} style={{ height: "500px", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

        <Circle
          center={center}
          radius={radius} 
          pathOptions={{ color: 'blue', fillColor: 'lightblue', fillOpacity: 0.5 }}
        />

      <Marker position={center} icon={userLocationIcon}>
        <Popup>
          You are here
        </Popup>
      </Marker>

      {markers?.map((offer: any) => (
        <Marker
          key={offer.id}
          position={[offer.latitude, offer.longitude]}
          icon={emojiIcon}
        >
          <Popup>
            <strong>{offer.title}</strong> <br />
            <strong>Pickup Location:</strong> {offer.pickupLocation} <br />
            <strong>Expiration Date:</strong> {formatDate(new Date(offer.expirationDate))} <br />
            <strong>Expiration Time:</strong> {formatTime(new Date(offer.expirationDate))} <br />
          </Popup>
        </Marker>
      ))}
    </MapContainer>


    </>
  );
}
