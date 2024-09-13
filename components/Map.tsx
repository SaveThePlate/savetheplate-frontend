"use client";
import React, { useEffect, useRef, useState } from "react";
import GoogleMap from "google-maps-react-markers";

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapProps {
  coordinates: Coordinates;
}

interface MarkerProps {
  lat: number;
  lng: number;
  key: number;
  children: React.ReactNode;
  style: React.CSSProperties;
}

const CustomMarker: React.FC<MarkerProps> = ({ lat, lng, children, style }) => {
  return (
    <div style={style}>
      {children}
    </div>
  );
};

export function Map({ coordinates }: MapProps) {
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [markers, setMarkers] = useState<Coordinates[]>([
    { lat: 36.806389, lng: 10.181667 }, // Default marker in Tunisia
  ]);

  const onGoogleApiLoaded = ({ map, maps }: any) => {
    mapRef.current = map;
    setMapReady(true);

    const service = new maps.places.PlacesService(map);

    const request = {
      location: { lat: coordinates.lat, lng: coordinates.lng },
      radius: '5000', // 5 km radius
      type: ['restaurant'],
    };

    // Perform the nearby search for restaurants
    service.nearbySearch(request, (results: any, status: any) => {
      if (status === maps.places.PlacesServiceStatus.OK) {
        const restaurantMarkers = results.map((place: any) => ({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }));
        setMarkers(restaurantMarkers);
      }
    });
  };
  
  useEffect(() => {
    if (coordinates.lat && coordinates.lng && mapReady) {
      setMarkers([{ lat: coordinates.lat, lng: coordinates.lng }]);
    }
  }, [coordinates, mapReady]);

  return (
    <>
      {mapReady && <div>Map is ready. Check logs in the developer console.</div>}
      <GoogleMap
        apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY} // Cast as string for TypeScript safety
        defaultCenter={{ lat: 36.806389, lng: 10.181667 }} // Default center coordinates
        defaultZoom={12}
        mapMinHeight="100vh"
        options={{}} // You can pass additional map options here
        onGoogleApiLoaded={onGoogleApiLoaded}
      >
        {markers.map((marker, i) => (
          <CustomMarker
            key={i}
            lat={marker.lat}
            lng={marker.lng}
            style={{
              color: "red",
              backgroundColor: "white",
              height: "25px",
              width: "25px",
              borderRadius: "50%",
              textAlign: "center",
              lineHeight: "25px", // Vertically center the emoji
            }}
          >
            📍
          </CustomMarker>
        ))}
      </GoogleMap>
    </>
  );
}
