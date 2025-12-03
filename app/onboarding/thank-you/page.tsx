"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const ThankYouPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6">
      <div className="relative w-full max-w-2xl">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#FFD6C9] blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-16 -right-6 w-40 h-40 rounded-full bg-[#C8E3F8] blur-3xl opacity-60" />

        <div className="relative z-10 w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-[#f5eae0] px-6 py-8 sm:px-10 sm:py-10 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600 mb-3">
            You&apos;re all set
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#344E41] mb-3">
            Thank you for joining <span className="text-[#FFAE8A]">Save The Plate</span>
          </h1>
          <p className="text-gray-700 text-sm sm:text-base max-w-md mx-auto mb-6">
            We&apos;ve received your information. Our team will review your profile and
            reach out to you to activate your account after verification.
          </p>
          <p className="text-xs text-gray-500 mb-8">
            You&apos;ll receive an email once your account is approved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="sm:w-auto w-full bg-[#A8DADC] hover:bg-[#92C7C9] text-[#1D3557]"
              onClick={() => router.push("/")}
            >
              Back to home page
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;


