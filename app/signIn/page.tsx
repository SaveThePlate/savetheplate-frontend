"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReloadIcon } from "@radix-ui/react-icons";
import useOpenApiFetch from "@/lib/OpenApiFetch";
import { AuthToast, ErrorToast } from "@/components/Toasts";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";

export default function SignIn() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  const clientApi = useOpenApiFetch();
  const router = useRouter();

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userRole = response?.data?.role;
        if (userRole === 'PROVIDER') {
          // Check if provider has submitted location details
          // If not, redirect to fillDetails page to complete their information
          try {
            const userDetails = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const { phoneNumber, mapsLink } = userDetails.data || {};
            // If location details are missing, redirect to fillDetails page to complete them
            if (!phoneNumber || !mapsLink) {
              router.push("/onboarding/fillDetails");
            } else {
              router.push("/provider/home");
            }
          } catch (error) {
            // If we can't fetch user details, redirect to fillDetails to be safe
            console.error("Error fetching user details:", error);
            router.push("/onboarding/fillDetails");
          }
        } else if (userRole === 'CLIENT') {
          // Redirect to client home
          router.push("/client/home");
        } else {
          setCheckingAuth(false);
        }
      } catch (error) {
        // Token is invalid or expired, allow sign in
        console.debug("Token check failed, showing sign in form");
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Validate email format
    if (!email || !email.includes('@')) {
      setShowErrorToast(true);
      setShowAuthToast(false);
      return;
    }

    setLoading(true);
    setShowErrorToast(false);
    setShowAuthToast(false);

    try {
      const resp = await clientApi.POST("/auth/send-magic-mail", {
        body: { email },
      });

      // Accept both 200 (OK) and 201 (Created) status codes
      const status = resp.response?.status;
      if (status === 200 || status === 201) {
        setShowAuthToast(true);
        setShowErrorToast(false);
      } else {
        console.error("Unexpected status code:", status, resp);
        setShowErrorToast(true);
        setShowAuthToast(false);
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Failed to send magic link:", err);
      
      let userMessage = "There was an error sending the magic link. Please try again.";
      
      // Check if it's a network error (502, CORS, etc.)
      if (err?.isNetworkError || 
          err?.status === 502 || 
          err?.status === 503 ||
          err?.message?.includes("Server is temporarily unavailable") ||
          err?.message?.includes("Network error")) {
        console.error("Network/Server error detected");
        userMessage = "Server is temporarily unavailable. Please try again in a few moments.";
      }
      // Check for CORS errors (usually happens when backend is down and Cloudflare returns 502 without CORS headers)
      else if (err?.message?.includes("CORS") || 
               err?.message?.includes("Access-Control") ||
               err?.message?.includes("Failed to fetch")) {
        console.error("CORS/Network error - likely backend is down");
        userMessage = "Unable to connect to the server. Please check your connection and try again.";
      }
      // Check if it's an API error with response data
      else if (err?.response?.data || err?.data) {
        userMessage = sanitizeErrorMessage(err, {
          action: "send magic link",
          defaultMessage: "There was an error sending the magic link. Please try again."
        });
      }
      
      setErrorMessage(userMessage);
      setShowErrorToast(true);
      setShowAuthToast(false);
      setLoading(false);
    }
  }

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] overflow-x-hidden">
        <div className="flex flex-col items-center gap-3">
          <ReloadIcon className="h-6 w-6 animate-spin text-[#A8DADC]" />
          <p className="text-gray-600 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] overflow-x-hidden flex items-center justify-center py-8 sm:py-12">
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="button" />
      </div>

      <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        {/* Sign In Form */}
        <main className="relative z-10 w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg px-6 sm:px-8 py-8 sm:py-10 border border-[#f5eae0] text-center">
          {/* Decorative soft blobs */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD6C9] rounded-full blur-2xl opacity-50 translate-x-8 -translate-y-8" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-50 -translate-x-8 translate-y-8" />
          <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#FAF1E2] rounded-full blur-xl opacity-60" />

          {/* Header */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#344e41] mb-3 animate-fadeInDown">
            {!isNewUser ? t("signin.welcome_new") : t("signin.welcome_back")}
          </h1>

          <p className="text-gray-700 text-sm sm:text-base mb-6 font-medium animate-fadeInUp">
            {!isNewUser
              ? t("signin.description_new")
              : t("signin.description_back")}
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col items-center w-full space-y-4 relative z-10">
            <Input
              placeholder="name@example.com"
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#A8DADC] focus:border-transparent"
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
            />

            {loading ? (
              <Button
                disabled
                className="w-full bg-[#A8DADC] text-white font-semibold py-3 rounded-xl flex justify-center items-center"
              >
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                {t("signin.sending")}
              </Button>
            ) : (
              <Button
                className="w-full bg-[#FFAE8A] hover:bg-[#ff9966] text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-300"
                type="submit"
                id="sign-in-button"
              >
                {t("signin.sign_in_email")}
              </Button>
            )}
          </form>

          {/* Separator */}
          <Separator orientation="horizontal" className="mt-6 mb-3 bg-[#f0ece7]" />

          {showAuthToast && AuthToast}
          {showErrorToast && <ErrorToast message={errorMessage} />}

          {/* Footer */}
          <p className="mt-4 text-center font-light text-xs sm:text-sm text-gray-500">
            {!isNewUser
              ? t("signin.footer_new")
              : t("signin.footer_back")}
          </p>
        </main>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInDown {
          animation: fadeInDown 0.8s ease-in-out;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
}
