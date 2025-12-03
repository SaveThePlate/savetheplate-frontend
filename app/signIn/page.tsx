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

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showAuthToast, setShowAuthToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
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
        if (userRole) {
          // Redirect to Get Started page after sign-in
          router.push("/");
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
    setLoading(true);

    clientApi
      .POST("/auth/send-magic-mail", {
        body: { email },
      })
      .then((resp) => {
        if (resp.response.status === 201) {
          setShowAuthToast(true);
          setShowErrorToast(false);
        } else {
          setShowErrorToast(true);
          setShowAuthToast(false);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to send magic link:", err);
        setShowErrorToast(true);
        setShowAuthToast(false);
        setLoading(false);
      });
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
      <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Sign In Form - Left side on desktop */}
        <div className="w-full lg:w-[45%] lg:max-w-md">
          <main className="relative z-10 w-full bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg px-6 sm:px-8 py-8 sm:py-10 border border-[#f5eae0] text-center">
            {/* Decorative soft blobs */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD6C9] rounded-full blur-2xl opacity-50 translate-x-8 -translate-y-8" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-50 -translate-x-8 translate-y-8" />
            <div className="absolute bottom-10 right-10 w-20 h-20 bg-[#FAF1E2] rounded-full blur-xl opacity-60" />

            {/* Header */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#344e41] mb-3 animate-fadeInDown">
              {!isNewUser ? "Welcome to SaveThePlate! 🥳" : "Welcome back! 🥰"}
            </h1>

            <p className="text-gray-700 text-sm sm:text-base mb-6 font-medium animate-fadeInUp">
              {!isNewUser
                ? "Join us in reducing food waste and saving the planet, one meal at a time 🌍"
                : "We're happy to have you back! Keep rescuing meals 🌿"}
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
                  Sending...
                </Button>
              ) : (
                <Button
                  className="w-full bg-[#FFAE8A] hover:bg-[#ff9966] text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-300"
                  type="submit"
                  id="sign-in-button"
                >
                  Sign In with Email
                </Button>
              )}
            </form>

            {/* Separator */}
            <Separator orientation="horizontal" className="mt-6 mb-3 bg-[#f0ece7]" />

            {showAuthToast && AuthToast}
            {showErrorToast && ErrorToast}

            {/* Footer */}
            <p className="mt-4 text-center font-light text-xs sm:text-sm text-gray-500">
              {!isNewUser
                ? "Check your inbox to complete your registration 💌"
                : "We've sent your magic link — check your email ✉️"}
            </p>
          </main>
        </div>

        {/* Right side on desktop - How it works + Benefits */}
        <div className="w-full lg:w-[55%] flex flex-col gap-4">
          {/* How it works */}
          <section className="w-full">
            <div className="bg-white/80 backdrop-blur-sm border border-[#f5eae0] rounded-3xl shadow-sm px-5 py-4 sm:px-6 sm:py-5">
              <h2 className="text-center text-xs sm:text-sm font-semibold text-[#344e41] tracking-[0.25em] uppercase mb-3">
                How it works
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE2D5] text-lg flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-[#344e41] text-sm">Discover surprise bags</p>
                    <p className="text-xs text-gray-600">
                      Browse nearby offers from local food providers at the end of the day.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9F3E5] text-lg flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-[#344e41] text-sm">Reserve your bag</p>
                    <p className="text-xs text-gray-600">
                      Secure a surprise bag in a few taps and receive your confirmation.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4ECFF] text-lg flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-[#344e41] text-sm">Pick up & save food</p>
                    <p className="text-xs text-gray-600">
                      Collect your bag at the pickup time and help reduce food waste.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="w-full">
            <h2 className="text-center text-sm sm:text-base font-extrabold text-[#344e41] mb-3">
              Why use Save The Plate?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#f5eae0] px-4 py-4 flex gap-3">
                <span className="text-xl flex-shrink-0" aria-hidden="true">
                  💸
                </span>
                <div>
                  <p className="font-semibold text-[#344e41] text-sm">Save money</p>
                  <p className="text-xs text-gray-600">
                    Enjoy quality food at reduced prices thanks to last-minute surprise bags.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#f5eae0] px-4 py-4 flex gap-3">
                <span className="text-xl flex-shrink-0" aria-hidden="true">
                  🌍
                </span>
                <div>
                  <p className="font-semibold text-[#344e41] text-sm">Reduce waste</p>
                  <p className="text-xs text-gray-600">
                    Help prevent perfectly good food from being thrown away.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#f5eae0] px-4 py-4 flex gap-3">
                <span className="text-xl flex-shrink-0" aria-hidden="true">
                  🏪
                </span>
                <div>
                  <p className="font-semibold text-[#344e41] text-sm">Support local spots</p>
                  <p className="text-xs text-gray-600">
                    Discover and support bakeries, restaurants, and shops in your area.
                  </p>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#f5eae0] px-4 py-4 flex gap-3">
                <span className="text-xl flex-shrink-0" aria-hidden="true">
                  ⏱️
                </span>
                <div>
                  <p className="font-semibold text-[#344e41] text-sm">Simple pickup</p>
                  <p className="text-xs text-gray-600">
                    Clear pickup windows and locations make the experience smooth and quick.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
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
