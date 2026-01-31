"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import EnhancedAddOffer from "@/components/EnhancedAddOffer";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const AddOfferPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { userRole, loading } = useUser();

  useEffect(() => {
    // Use UserContext instead of making redundant API calls
    if (loading) return;
    
    const token = localStorage.getItem("accessToken");
    if (!token || !userRole || userRole === "NONE") {
      router.push("/signIn");
      return;
    }

    // Only providers can add offers
    if (userRole !== "PROVIDER" && userRole !== "PENDING_PROVIDER") {
      router.push("/client/home");
    }
  }, [router, userRole, loading]);

  // Prevent overscroll bounce on mobile (but allow touch for inputs)
  useEffect(() => {
    const body = document.body;
    body.style.touchAction = "pan-x pan-y";
    
    return () => {
      body.style.touchAction = "";
    };
  }, []);

  return (
    <div className="w-full min-h-[100dvh] mx-auto px-3 sm:px-4 md:px-6 max-w-4xl pt-4 sm:pt-6 md:pt-8 lg:pt-12 pb-20 sm:pb-24 lg:pb-8">
      <main className="relative w-full max-w-4xl bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-xl border border-border p-4 sm:p-6 md:p-8 mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-4 sm:mb-6 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-2 sm:mb-3">
            <span className="text-xl sm:text-2xl md:text-3xl">🍽️</span>
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight mb-1">
            {t("add_offer.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2 px-4 max-w-2xl">
            {t("add_offer.subtitle")}
          </p>
        </div>

        {/* Add Offer Form */}
        <section className="mt-6 sm:mt-8">
          <EnhancedAddOffer />
        </section>
      </main>
    </div>
  );
};

export default AddOfferPage;
