"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const ThankYouPage = () => {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6">
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="button" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#FFD6C9] blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-16 -right-6 w-40 h-40 rounded-full bg-[#C8E3F8] blur-3xl opacity-60" />

        <div className="relative z-10 w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-[#f5eae0] px-6 py-8 sm:px-10 sm:py-10 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600 mb-3">
            {t("onboarding.all_set")}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#344E41] mb-3">
            {t("onboarding.thank_you")} <span className="text-[#FFAE8A]">Save The Plate</span>
          </h1>
          <p className="text-gray-700 text-sm sm:text-base max-w-md mx-auto mb-6">
            {t("onboarding.received_info")}
          </p>
          <p className="text-xs text-gray-500 mb-8">
            {t("onboarding.email_approval")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="sm:w-auto w-full bg-[#A8DADC] hover:bg-[#92C7C9] text-[#1D3557]"
              onClick={() => router.push("/")}
            >
              {t("onboarding.back_home")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;


