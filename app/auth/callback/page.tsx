"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState, Suspense } from "react";
import { LocalStorage } from "@/lib/utils";
import axios from "axios";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Facebook OAuth Callback Handler
 * 
 * This endpoint handles the OAuth callback from Facebook.
 * Facebook redirects here with a `code` parameter that needs to be exchanged
 * for an access token via the backend.
 * 
 * Flow:
 * 1. User clicks "Login with Facebook" on sign-in page
 * 2. Facebook redirects to this endpoint with `code` and `state` query params
 * 3. This page sends the `code` to backend `/auth/facebook/callback`
 * 4. Backend exchanges code for Facebook access token, then creates/authenticates user
 * 5. Backend returns JWT tokens
 * 6. User is redirected based on their role
 */
function FacebookAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get OAuth code from query parameters
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const errorParam = searchParams.get("error");
        const errorReason = searchParams.get("error_reason");
        const errorDescription = searchParams.get("error_description");

        // Check for OAuth errors from Facebook
        if (errorParam) {
          console.error("Facebook OAuth error:", {
            error: errorParam,
            reason: errorReason,
            description: errorDescription,
          });

          let errorMessage = "Facebook authentication was cancelled or failed.";
          if (errorReason === "user_denied") {
            errorMessage = "You cancelled the Facebook login. Please try again if you want to sign in.";
          } else if (errorDescription) {
            errorMessage = `Facebook authentication error: ${errorDescription}`;
          }

          setError(errorMessage);
          setTimeout(() => {
            router.push("/signIn");
          }, 3000);
          return;
        }

        // Verify we have a code
        if (!code) {
          throw new Error("No authorization code received from Facebook");
        }

        // Exchange code for tokens via backend
        // The backend should handle:
        // 1. Exchanging the code for a Facebook access token
        // 2. Fetching user info from Facebook
        // 3. Creating/updating user in database
        // 4. Returning JWT tokens
        const backendResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/facebook/callback`,
          {
            code: code,
            state: state, // Optional: for CSRF protection
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // Check if response has tokens
        if (!backendResponse.data?.accessToken || !backendResponse.data?.refreshToken) {
          throw new Error("Invalid response from server: missing tokens");
        }

        // Store tokens
        LocalStorage.setItem("refresh-token", backendResponse.data.refreshToken);
        LocalStorage.setItem("accessToken", backendResponse.data.accessToken);
        LocalStorage.removeItem("remember");

        // Determine redirect based on user's role
        const role = backendResponse.data.role || backendResponse.data.user?.role;
        let redirectTo = "/onboarding"; // Default for new users

        // If user has a valid role, determine redirect
        if (role === "PROVIDER") {
          try {
            const userDetails = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
              {
                headers: {
                  Authorization: `Bearer ${backendResponse.data.accessToken}`,
                },
              }
            );
            const { phoneNumber, mapsLink } = userDetails.data || {};
            if (!phoneNumber || !mapsLink) {
              redirectTo = "/onboarding/fillDetails";
            } else {
              redirectTo = "/provider/home";
            }
          } catch (error) {
            console.error("Error fetching user details:", error);
            redirectTo = "/onboarding/fillDetails";
          }
        } else if (role === "PENDING_PROVIDER") {
          redirectTo = "/onboarding/thank-you";
        } else if (role === "CLIENT") {
          redirectTo = "/client/home";
        }

        // Use backend's redirectTo if provided and valid
        if (
          role &&
          role !== "NONE" &&
          typeof backendResponse.data.redirectTo === "string" &&
          backendResponse.data.redirectTo &&
          backendResponse.data.redirectTo !== "/"
        ) {
          redirectTo = backendResponse.data.redirectTo;
        }

        // Redirect user
        router.push(redirectTo);
      } catch (err: any) {
        console.error("Error handling Facebook OAuth callback:", err);
        console.error("Error details:", {
          status: err?.response?.status,
          statusText: err?.response?.statusText,
          data: err?.response?.data,
          message: err?.message,
        });

        let errorMessage =
          t("callback.verify_failed") ||
          "Failed to complete Facebook authentication. Please try again.";

        if (err?.response?.status === 500) {
          const errorDetails = err?.response?.data;
          console.error("Backend Facebook callback error (500):", errorDetails);
          errorMessage = `Server error during Facebook authentication. ${
            errorDetails?.message
              ? `Error: ${errorDetails.message}`
              : "Please check the backend logs."
          }`;
        } else if (err?.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        // Redirect to sign in after a delay
        setTimeout(() => {
          router.push("/signIn");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [searchParams, router, t]);

  // Show loading state while processing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">
            {t("callback.verifying") || "Completing Facebook authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error state if callback failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE]">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <p className="text-red-600 font-semibold">{error}</p>
          <p className="text-gray-600 text-sm">
            {t("callback.redirecting") || "Redirecting to sign in..."}
          </p>
        </div>
      </div>
    );
  }

  return null;
}

function FacebookAuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      }
    >
      <FacebookAuthCallbackContent />
    </Suspense>
  );
}

export default FacebookAuthCallback;

