"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const OnboardingPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [role, setRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (selectedRole: string) => setRole(selectedRole);

  const handleSubmitRole = async () => {
    if (!role) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        router.push("/signIn");
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/set-role`,
        { role },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          } 
        }
      );

      if (role === "PROVIDER") router.push("/onboarding/fillDetails");
      else router.push("/client/home");
    } catch (error: any) {
      console.error("Error setting role:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to set role. Please try again.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4">
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="button" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#FFD6C9] blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-16 -right-6 w-40 h-40 rounded-full bg-[#C8E3F8] blur-3xl opacity-60" />

        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-[#f5eae0] px-6 py-8 sm:px-10 sm:py-10">
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600">
              {t("onboarding.step_1_of_2")}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#344E41]">
              {t("onboarding.tell_us_who")}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
              {t("onboarding.choose_how")}
            </p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <button
              type="button"
              onClick={() => handleRoleSelect("PROVIDER")}
              className={`flex flex-col items-start justify-between gap-3 p-5 rounded-2xl border-2 text-left transition-all ${
                role === "PROVIDER"
                  ? "border-emerald-500 bg-emerald-50 shadow-md"
                  : "border-gray-200 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                🍽️
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{t("onboarding.food_provider")}</p>
                <p className="text-xs text-gray-600">
                  {t("onboarding.provider_description")}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleSelect("CLIENT")}
              className={`flex flex-col items-start justify-between gap-3 p-5 rounded-2xl border-2 text-left transition-all ${
                role === "CLIENT"
                  ? "border-yellow-400 bg-yellow-50 shadow-md"
                  : "border-gray-200 bg-gray-50 hover:border-yellow-300 hover:bg-yellow-50"
              }`}
            >
              <span className="text-3xl" aria-hidden="true">
                😋
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{t("onboarding.client")}</p>
                <p className="text-xs text-gray-600">
                  {t("onboarding.client_description")}
                </p>
              </div>
            </button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-gray-500 mb-4">
            {t("onboarding.helper_text")}
          </p>

          {/* Submit Button */}
          <button
            onClick={handleSubmitRole}
            disabled={!role || isSubmitting}
            className="w-full py-3 rounded-full bg-emerald-500 text-white font-semibold text-base sm:text-lg transition-colors disabled:bg-gray-200 disabled:text-gray-500"
          >
            {isSubmitting ? t("onboarding.saving_choice") : role === "PROVIDER" ? t("onboarding.continue_provider") : t("onboarding.continue_client")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
