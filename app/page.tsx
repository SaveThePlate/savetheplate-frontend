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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-6">
      <div className="relative z-10 w-full max-w-md text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-md px-8 py-12 overflow-hidden border border-[#f5eae0]">
        
        {/* Decorative pastel blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#FFD6C9] rounded-full blur-2xl opacity-50 translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#C8E3F8] rounded-full blur-2xl opacity-50 -translate-x-12 translate-y-12" />
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-[#FAF1E2] rounded-full blur-xl opacity-60" />

        {/* Logo / Image */}
        <div className="mb-6 relative z-10">
          <Image
            src="/loveyou.png"
            width={160}
            height={160}
            alt="Save The Plate"
            className="mx-auto animate-float"
            // ensure CSS animations or layout don't break the intrinsic aspect ratio
            // when only one dimension is changed via CSS. Keep both dimensions auto.
            style={{ width: "auto", height: "auto" }}
            // This image is above the fold and acts as an LCP element on the landing page.
            // Mark it as priority so Next.js preloads it to improve LCP metrics.
            priority
          />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-extrabold text-[#344e41] mb-4 tracking-tight">
          Welcome to{" "}
          <span className="text-[#FFAE8A]">Save The Plate</span>
        </h1>

        {/* Subtitle */}
        <p className="text-gray-700 text-lg mb-8 font-medium">
          Discover delicious meals and help reduce food waste 🌿
        </p>

        {/* Button */}
        <button
          onClick={handleGetStarted}
          className="w-full bg-[#A8DADC] hover:bg-[#92c7c9] text-[#1D3557] font-semibold py-3 rounded-full transition-all duration-300 shadow-sm"
        >
          Get Started
        </button>
      </div>

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
