"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import AddOffer from "@/components/AddOffer";
import { useLanguage } from "@/context/LanguageContext";

const AddOfferPage = () => {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axiosInstance.get(
          `/auth/get-user-by-token`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.status !== 200) throw new Error("Invalid response");
      } catch {
        router.push("/signIn");
      }
    };

    verifyToken();
  }, [router]);

  // Prevent overscroll bounce on mobile (but allow touch for inputs)
  useEffect(() => {
    const body = document.body;
    body.style.touchAction = "pan-x pan-y";
    
    return () => {
      body.style.touchAction = "";
    };
  }, []);

  return (
    <div className="w-full min-h-[100dvh] mx-auto px-2 sm:px-4 md:px-6 max-w-2xl lg:max-w-4xl pt-3 sm:pt-4 md:pt-6 lg:pt-12 pb-20 sm:pb-24 lg:pb-6">
    <main className="relative w-full max-w-2xl lg:max-w-4xl bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl border border-border p-3 sm:p-4 md:p-6 lg:p-8 mx-auto">
      {/* Header */}
      <div className="flex flex-col items-center mb-3 sm:mb-4 text-center">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2 sm:mb-3">
          <span className="text-xl sm:text-2xl md:text-3xl">🍽️</span>
        </div>
        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-foreground tracking-tight mb-1">
          {t("add_offer.title")}
        </h1>
      </div>

      {/* Add Offer Form */}
      <section>
        <AddOffer />
      </section>
    </main>
    </div>
  );
};

export default AddOfferPage;
