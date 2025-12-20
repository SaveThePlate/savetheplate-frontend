"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";
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

  // Prevent overscroll bounce on mobile (but allow touch for inputs)
  useEffect(() => {
    const body = document.body;
    body.style.touchAction = "pan-x pan-y";
    
    return () => {
      body.style.touchAction = "";
    };
  }, []);

  return (
    <div className="w-full min-h-[100dvh] mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-4xl pt-6 sm:pt-8 md:pt-10 lg:pt-12 pb-20 sm:pb-24 lg:pb-6 flex flex-col items-center">
    <main className="relative w-full max-w-2xl lg:max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-border p-4 sm:p-6 md:p-8 flex flex-col min-h-[calc(100dvh-8rem)] lg:min-h-[calc(100vh-8rem)] max-h-[calc(100dvh-8rem)] lg:max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex flex-col items-center mb-4 text-center flex-shrink-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2 sm:mb-3">
          <span className="text-xl sm:text-2xl md:text-3xl">🍽️</span>
        </div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground tracking-tight mb-1">
          {t("add_offer.title")}
        </h1>
      </div>

      {/* Add Offer Form */}
      <section className="flex-1 min-h-0 overflow-hidden">
        <AddOffer />
      </section>
    </main>
    </div>
  );
};

export default AddOfferPage;
