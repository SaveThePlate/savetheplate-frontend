"use client";

import { useEffect } from "react";
import Script from "next/script";

export default function FacebookSDK() {
  useEffect(() => {
    // This will run after the script loads
    if (typeof window !== "undefined" && (window as any).FB) {
      (window as any).FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    }
  }, []);

  if (!process.env.NEXT_PUBLIC_FACEBOOK_APP_ID) {
    return null;
  }

  return (
    <Script
      src="https://connect.facebook.net/en_US/sdk.js"
      strategy="lazyOnload"
      onLoad={() => {
        if (typeof window !== "undefined" && (window as any).FB) {
          (window as any).FB.init({
            appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",
            cookie: true,
            xfbml: true,
            version: "v18.0",
          });
        }
      }}
    />
  );
}

