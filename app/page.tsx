"use client";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";

const WelcomePage = () => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  const handleGetStarted = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/signIn");
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
        setRole(userRole);
        router.push(
          userRole === "PROVIDER"
            ? "/provider/home"
            : userRole === "CLIENT"
            ? "/client/home"
            : "/onboarding"
        );
      } else {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6 py-6 sm:py-10 flex flex-col">
      {/* Top bar */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between mb-6 sm:mb-10">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Save The Plate"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span className="text-sm sm:text-base font-semibold text-[#344e41]">
            Save The Plate
          </span>
        </div>
        <button
          onClick={() => router.push("/signIn")}
          className="text-xs sm:text-sm font-medium text-[#344e41] bg-white/70 border border-[#e2ddd5] rounded-full px-3 py-1.5 shadow-sm hover:bg-white"
        >
          Sign in
        </button>
      </header>

      {/* Main content */}
      <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col gap-10">
        {/* Hero */}
        <section className="flex flex-col-reverse lg:flex-row items-center gap-10">
          {/* Left: text + actions */}
          <div className="w-full lg:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-[#f5eae0] px-3 py-1 text-xs font-medium text-[#344e41] mb-4">
              <span className="text-base">🌿</span>
              <span>Save food. Save money. Support local.</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#344e41] tracking-tight mb-4">
              Rescue delicious food{" "}
              <span className="text-[#FFAE8A]">before it goes to waste</span>
            </h1>

            <p className="text-sm sm:text-base text-gray-700 mb-6 max-w-xl">
              Discover surprise bags from nearby bakeries, cafés and restaurants.
              Enjoy great food at friendly prices while helping the planet.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#A8DADC] hover:bg-[#92c7c9] text-[#1D3557] font-semibold text-sm shadow-sm"
              >
                Get started in seconds
              </button>
              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/80 border border-[#e2ddd5] text-[#344e41] text-sm font-medium shadow-sm"
              >
                How it works
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/signIn")}
                className="underline underline-offset-2"
              >
                Sign in here
              </button>
              .
            </p>
          </div>

          {/* Right: illustration card */}
          <div className="w-full lg:w-1/2">
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-md border border-[#f5eae0] px-6 py-8 flex flex-col items-center overflow-hidden">
              <div className="absolute -top-12 -right-10 w-40 h-40 bg-[#FFD6C9] rounded-full blur-3xl opacity-60" />
              <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-[#C8E3F8] rounded-full blur-3xl opacity-60" />

              <div className="relative z-10 mb-4">
                <Image
                  src="/loveyou.png"
                  width={190}
                  height={190}
                  alt="Save The Plate illustration"
                  className="mx-auto animate-float"
                  style={{ width: "auto", height: "auto" }}
                  priority
                />
              </div>

              <p className="relative z-10 text-sm text-gray-700 font-medium text-center max-w-xs">
                “Every surprise bag is a win for your wallet and the planet.”
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="w-full">
        <div className="bg-white/80 backdrop-blur-sm border border-[#f5eae0] rounded-3xl shadow-sm px-6 py-5 sm:px-8 sm:py-6 max-w-4xl mx-auto">
          <h2 className="text-center text-sm font-semibold text-[#344e41] tracking-[0.25em] uppercase mb-4">
            How it works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFE2D5] text-lg">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D9F3E5] text-lg">
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
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4ECFF] text-lg">
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
        <section className="w-full max-w-4xl mx-auto mt-4 mb-4">
          <h2 className="text-center text-base sm:text-lg font-extrabold text-[#344e41] mb-4">
            Why use Save The Plate?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-[#f5eae0] px-4 py-4 flex gap-3">
              <span className="text-xl" aria-hidden="true">
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
              <span className="text-xl" aria-hidden="true">
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
              <span className="text-xl" aria-hidden="true">
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
              <span className="text-xl" aria-hidden="true">
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
      </main>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
