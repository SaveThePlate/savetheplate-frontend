"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
  }
}

export default function FacebookSDK() {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  useEffect(() => {
    if (!appId) {
      return;
    }

    // Set up the Facebook SDK initialization function
    // This follows the official Facebook SDK pattern
    window.fbAsyncInit = function () {
      if (window.FB) {
        window.FB.init({
          appId: appId,
          xfbml: true,
          version: "v24.0",
        });
      }
    };
  }, [appId]);

  if (!appId) {
    return null;
  }

  return (
    <Script
      src="https://connect.facebook.net/en_US/sdk.js"
      strategy="afterInteractive"
      async
      defer
      crossOrigin="anonymous"
    />
  );
}

