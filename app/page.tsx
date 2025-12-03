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
    <div className="h-screen bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6 py-6 sm:py-10 flex flex-col">
      {/* Main content */}
      <main className="w-full max-w-6xl mx-auto flex-1 flex flex-col gap-10 justify-center items-center">
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
            </div>
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
