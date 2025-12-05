"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, ShoppingBag, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";

const SelectOfferTypePage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F9FAF5] flex items-center justify-center px-4 py-16">
      <main className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 sm:p-10 flex flex-col items-center transition-all duration-300 hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)]">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center text-gray-500 hover:text-green-700 gap-2 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Header */}
        <div className="flex flex-col items-center mb-10 mt-4 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EAF7ED] flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-green-800" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-green-900">
            Create New Offer
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-xs">
            Choose how you&apos;d like to share your surplus and make a positive impact 🌍
          </p>
        </div>

        {/* Offer Buttons */}
        <div className="w-full flex flex-col gap-5">
          <button
            className="w-full flex items-center justify-center gap-3 font-semibold py-4 rounded-2xl bg-emerald-600 text-white shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
            onClick={() => router.push("./addOffer")}
          >
            <ShoppingBag className="w-5 h-5" />
            Custom Offer
          </button>

          <button
            className="w-full flex items-center justify-center gap-3 font-semibold py-4 rounded-2xl bg-[#EAF7ED] text-[#1B4332] border-2 border-emerald-200 shadow-sm hover:bg-[#d5f2e0] hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
            onClick={() => router.push("./createMagicBox")}
          >
            <Gift className="w-5 h-5" />
            Quick Rescue Pack
          </button>
        </div>

        {/* Rescue Pack Info Section */}
        <section className="mt-10 w-full bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-[#243B28] mb-2">
                What is a Rescue Pack?
              </h2>
              <p className="text-[#4A4A4A] text-sm leading-relaxed">
                A Rescue Pack is a pre-configured bundle of rescued food items. Choose from small, medium, or large sizes with preset prices. Perfect for quick listings when you have mixed surplus items! 🍞🥐🍓
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Let’s save good food together 💚
        </p>
      </main>
    </div>
  );
};

export default SelectOfferTypePage;
