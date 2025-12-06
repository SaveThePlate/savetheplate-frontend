"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { LocalStorage } from "@/lib/utils";
import useOpenApiFetch from "@/lib/OpenApiFetch";
import { ReloadIcon } from "@radix-ui/react-icons";

function AuthCallback() {
  const { token }: { token: string } = useParams();
  const router = useRouter();
  const clientApi = useOpenApiFetch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyAndRedirect = async () => {
      try {
        setLoading(true);
        setError(null);

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

        const accessToken = resp.data.accessToken;
        if (accessToken) {
          try {
            const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
            const role = decodedToken?.role;

            // Redirect based on role
            // If no role (new user), redirect to onboarding
            // If role exists, redirect to appropriate home page
            if (role === 'PROVIDER') {
              router.push("/provider/home");
            } else if (role === 'CLIENT') {
              router.push("/client/home");
            } else {
              // New user - no role assigned yet, redirect to onboarding
              router.push("/onboarding");
            }
          } catch (error) {
            console.error("Error decoding token", error);
            // If token decoding fails, redirect to onboarding as fallback
            router.push("/onboarding");
          }
        } else {
          // No access token, redirect to onboarding
          router.push("/onboarding");
        }
      } catch (error: any) {
        console.error("Error verifying magic link:", error);
        setError("Failed to verify magic link. Please try signing in again.");
        // Redirect to sign in after a delay
        setTimeout(() => {
          router.push("/signIn");
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    verifyAndRedirect();
  }, [token, clientApi, router]);

  // Show loading state while verifying
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE]">
        <div className="flex flex-col items-center gap-3">
          <ReloadIcon className="h-6 w-6 animate-spin text-[#A8DADC]" />
          <p className="text-gray-600 text-sm">Verifying your magic link...</p>
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
          <p className="text-gray-600 text-sm">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return null;
}

export default AuthCallback;
