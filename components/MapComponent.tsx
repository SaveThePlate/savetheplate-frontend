"use client";
import React, { useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const emojiIcon = new L.DivIcon({
  html: "📍", 
  className: "",
  iconSize: [1000, 1000],
  iconAnchor: [15, 30],
});

export function MapComponent({ markers, center }:any) {

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  

  return (
    <MapContainer center={center} zoom={13} style={{ height: "400px", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {markers?.map((offer:any) => (
        <Marker
          key={offer.id}
          position={[offer.latitude, offer.longitude]}
          icon={emojiIcon}
        >
          <Popup>
          
          <strong>{offer.title}</strong> <br/>
          <strong>Pickup Location:</strong> {offer.pickupLocation} <br/>
          <strong>Expiration Date:</strong> {formatDate(new Date(offer.expirationDate))} <br/>
          <strong>Expiration Time:</strong> {formatTime(new Date(offer.expirationDate))} <br/>
       
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
