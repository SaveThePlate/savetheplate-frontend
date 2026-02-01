"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: any;
    checkLoginState?: () => void;
    statusChangeCallback?: (response: any) => void;
  }
}

export default function FacebookSDK() {
  const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
  const apiVersion = "v24.0";

  useEffect(() => {
    if (!appId) {
      return;
    }

    // Status change callback - Called with the results from FB.getLoginStatus()
    window.statusChangeCallback = function (response: any) {
      console.log('statusChangeCallback');
      console.log(response); // The current login status of the person.
      
      if (response.status === 'connected') {
        // Logged into your webpage and Facebook.
        testAPI();
      } else {
        // Not logged into your webpage or we are unable to tell.
        // This is handled by the sign-in page, so we don't need to update UI here
        console.log('User is not connected to Facebook');
      }
    };

    // Check login state - Called when a person is finished with the Login Button
    window.checkLoginState = function () {
      if (window.FB && typeof window !== 'undefined' && window.location.protocol === 'https:') {
        window.FB.getLoginStatus(function (response: any) {
          // See the onlogin handler
          if (window.statusChangeCallback) {
            window.statusChangeCallback(response);
          }
        });
      } else if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
        console.warn('Facebook login requires HTTPS. Current protocol:', window.location.protocol);
      }
    };

    // Test API - Testing Graph API after login
    function testAPI() {
      console.log('Welcome!  Fetching your information.... ');
      if (window.FB) {
        window.FB.api('/me', function (response: any) {
          console.log('Successful login for: ' + response.name);
        });
      }
    }

    // Set up the Facebook SDK initialization function
    // This follows the official Facebook SDK pattern
    // Note: We deliberately do NOT call FB.getLoginStatus() here to avoid
    // the "overriding current access token" warning that occurs when
    // FB.login() is called after getLoginStatus() has set an internal token.
    window.fbAsyncInit = function () {
      if (window.FB) {
        try {
          window.FB.init({
            appId: appId,
            cookie: true,                     // Enable cookies to allow the server to access the session.
            xfbml: true,                     // Parse social plugins on this webpage.
            version: apiVersion,             // Use this Graph API version for this call.
            // Do NOT set frictionlessRequests here as it can cause token conflicts
          });

          console.log('Facebook SDK initialized successfully with App ID:', appId);

          // Note: We intentionally skip FB.getLoginStatus() during initialization
          // to avoid the "overriding current access token" warning.
          // The login status will be checked when the user actually clicks the login button.
          // This prevents conflicts between the SDK's internal token state and
          // the token returned by FB.login().
        } catch (error: any) {
          console.error('Facebook SDK initialization error:', error);
          // Store error for sign-in page to display
          if (typeof window !== 'undefined') {
            (window as any).facebookSDKError = error?.message || 'Facebook SDK initialization failed';
          }
        }
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
