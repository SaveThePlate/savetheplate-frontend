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
        <div className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-xs font-medium mb-3">
          🌱 Reduce Waste, Share More
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-green-900 tracking-tight">
          Add a New Offer
        </h1>

        <p className="text-gray-500 text-sm sm:text-base mt-2 max-w-sm leading-relaxed">
          Surprise your customers and help reduce waste 💚 <br />
          Every box you create makes a difference 🌍
        </p>
      </div>

      {/* Add Offer Form */}
      <section className="space-y-6">
        <AddOffer />
      </section>

      {/* Footer Message */}
      <footer className="mt-10 text-center border-t border-gray-100 pt-5">
        <p className="text-xs sm:text-sm text-gray-400">
          Every offer helps make a positive impact 🍃
        </p>
      </footer>
    </main>
  </div>
);

};

export default AddOfferPage;
