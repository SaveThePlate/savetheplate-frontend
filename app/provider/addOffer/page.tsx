"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";
import AddOffer from "@/components/AddOffer";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const AddOfferPage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/get-user-by-token`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.status !== 200) throw new Error("Invalid response");
      } catch {
        router.push("/signIn");
      }
    };

    verifyToken();
  }, [router]);

return (
  <div className="bg-[#F9FAF5] min-h-screen pt-24 pb-20 flex flex-col items-center">
    <main className="relative w-full max-w-lg bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-10 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="absolute top-4 left-4 flex items-center text-gray-500 hover:text-green-700 gap-2 text-sm sm:text-base transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline font-medium">Back</span>
      </Button>

      {/* Header */}
      <div className="flex flex-col items-center mt-6 mb-8 text-center">
        <div className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-sm">
          🌱 Create Custom Offer
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Create Custom Offer
        </h1>

        <p className="text-gray-600 text-sm sm:text-base mt-3 max-w-md leading-relaxed">
          Set your own title, description, price, and photos. Perfect for specific items or special promotions! 💚
        </p>
      </div>

      {/* Add Offer Form */}
      <section className="space-y-6">
        <AddOffer />
      </section>

      {/* Footer Message */}
      <footer className="mt-8 text-center border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-400">
          💡 Tip: Add clear photos and detailed descriptions to attract more customers!
        </p>
      </footer>
    </main>
  </div>
);

};

export default AddOfferPage;
