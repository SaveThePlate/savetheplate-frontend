"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { LocalStorage } from "@/lib/utils";
import useOpenApiFetch from "@/lib/OpenApiFetch";
import axios from "axios";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useLanguage } from "@/context/LanguageContext";

function AuthCallback() {
  const { token }: { token: string } = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const clientApi = useOpenApiFetch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if this is an order QR token (not an auth token)
        // Order tokens are typically longer and don't match auth token format
        // If the token looks like an order token, redirect providers to orders page
        const accessToken = LocalStorage.getItem("accessToken");
        if (accessToken && token.length > 50) {
          // This might be an order QR token, check if user is a provider
          try {
            const testResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/qr/${token}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            // If this succeeds, it's an order token and user is logged in as provider
            // Redirect to orders page
            router.push("/provider/orders");
            return;
          } catch {
            // Not an order token or user doesn't have access, continue with auth verification
          }
        }

        const resp = await clientApi.POST("/auth/verify-magic-mail", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: {
            token: token,
          },
        });

        // Check if response data exists
        if (!resp.data || !resp.data.accessToken || !resp.data.refreshToken) {
          throw new Error("Invalid response from server");
        }

        // Store tokens
        LocalStorage.setItem("refresh-token", resp.data.refreshToken);
        LocalStorage.setItem("accessToken", resp.data.accessToken);
        LocalStorage.removeItem("remember");

        // Determine redirect based on user's role
        // Priority: Check role first to identify new users, then use backend redirectTo if available
        const role = resp.data.role || resp.data.user?.role;
        let redirectTo = '/onboarding'; // Default for new users
        
        // If user has a valid role, determine redirect
        if (role === 'PROVIDER') {
          // Check if provider has submitted location details
          // If not, redirect to fillDetails page to complete their information
          try {
            const userDetails = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
              { headers: { Authorization: `Bearer ${resp.data.accessToken}` } }
            );
            const { phoneNumber, mapsLink } = userDetails.data || {};
            // If location details are missing, redirect to fillDetails page to complete them
            if (!phoneNumber || !mapsLink) {
              redirectTo = '/onboarding/fillDetails';
            } else {
              redirectTo = '/provider/home';
            }
          } catch (error) {
            // If we can't fetch user details, redirect to fillDetails to be safe
            console.error("Error fetching user details:", error);
            redirectTo = '/onboarding/fillDetails';
          }
        } else if (role === 'PENDING_PROVIDER') {
          redirectTo = '/onboarding/thank-you';
        } else if (role === 'CLIENT') {
          redirectTo = '/client/home';
        } else {
          // User has no role or role is 'NONE' - they are new and need onboarding
          redirectTo = '/onboarding';
        }

        // Only use backend's redirectTo if user already has a valid role
        // This prevents new users from being redirected to '/' or other incorrect paths
        if (role && role !== 'NONE' && typeof resp.data.redirectTo === 'string' && resp.data.redirectTo && resp.data.redirectTo !== '/') {
          // Backend provided a redirectTo and user has a valid role, use it
          redirectTo = resp.data.redirectTo;
        }

        // Redirect to the determined path
        router.push(redirectTo);
      } catch (error: any) {
        console.error("Error verifying magic link:", error);
        setError(t("callback.verify_failed"));
        // Redirect to sign in after a delay
        setTimeout(() => {
          router.push("/signIn");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    verifyAndRedirect();
  }, [token, clientApi, router, t]);

  // Show loading state while verifying
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE]">
        <div className="flex flex-col items-center gap-3">
          <ReloadIcon className="h-6 w-6 animate-spin text-[#A8DADC]" />
          <p className="text-gray-600 text-sm">{t("callback.verifying")}</p>
        </div>
      </div>
    );
  }

  // Show error state if verification failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE]">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <p className="text-red-600 font-semibold">{error}</p>
          <p className="text-gray-600 text-sm">{t("callback.redirecting")}</p>
        </div>
      </div>
    );
  }

  return null;
}

export default AuthCallback;
