"use client"; 
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });

const MapComponent = ({ markers, center }:any) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true); 
  }, []);

  return (
    <div>
      {isMounted ? <LeafletMap markers={markers} center={center} /> : null}
    </div>
  );
};

export default MapComponent;
