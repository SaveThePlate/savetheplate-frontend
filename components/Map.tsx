"use client"
import React, { useEffect, useRef, useState } from 'react';
import GoogleMap from 'google-maps-react-markers'
export function Map() {

    const mapRef = useRef(null)
    const [mapReady, setMapReady] = useState(false)

    const onGoogleApiLoaded = ({ map, maps }:any) => {
        mapRef.current = map
        setMapReady(true)
      }
    




    return (
        <>
      {mapReady && <div>Map is ready. See for logs in developer console.</div>}
      <GoogleMap
        apiKey={process.env.NEXT_PUBLIC_MAPS_API_KEY}
        defaultCenter={{ lat: 36.806389, lng: 10.181667 }}
        defaultZoom={12}
        mapMinHeight="100vh"
        options={{}}
        onGoogleApiLoaded={onGoogleApiLoaded}
        onChange={(map) => console.log('Map moved', map)}
      >
       
      </GoogleMap>
    </>
    )
}

