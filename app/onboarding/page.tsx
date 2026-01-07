"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "react-toastify";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  normalizeAuthIntentRole,
  readAuthIntentRole,
  writeAuthIntentRole,
  type AuthIntentRole,
} from "@/lib/authIntent";

const OnboardingContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const { userRole, loading: userLoading, fetchUserRole } = useUser();
  const [role, setRole] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const didAttemptRoleFetchRef = useRef(false);
  const didAutoSubmitRef = useRef(false);
  const [intentRole, setIntentRole] = useState<AuthIntentRole | null>(null);

  // Capture auth intent from query/localStorage (e.g. /onboarding?intent=CLIENT)
  useEffect(() => {
    const fromQuery = normalizeAuthIntentRole(searchParams?.get("intent"));
    if (fromQuery) {
      writeAuthIntentRole(fromQuery);
      setIntentRole(fromQuery);
      return;
    }
    setIntentRole(readAuthIntentRole());
  }, [searchParams]);

  // Check if user already has a role and pre-select it
  useEffect(() => {
    const checkCurrentRole = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          return;
        }

        // Prefer UserContext (already fetched on app load) to avoid duplicate calls.
        // If context isn't ready yet, fetch once via context helper.
        if (userLoading) return;
        if (!userRole) {
          // Trigger a single refresh; avoid infinite loops if the request keeps failing.
          if (didAttemptRoleFetchRef.current) return;
          didAttemptRoleFetchRef.current = true;
          await fetchUserRole();
          return;
        }

        // Pre-select the role if user already has one (PROVIDER, CLIENT, or PENDING_PROVIDER)
        if (userRole && userRole !== 'NONE') {
          // Map PENDING_PROVIDER to PROVIDER for selection
          setRole(userRole === 'PENDING_PROVIDER' ? 'PROVIDER' : userRole);
        }
      } catch (error) {
        console.error("Error checking current role:", error);
      }
    };

    checkCurrentRole();
  }, [userRole, userLoading, fetchUserRole]);

  const handleRoleSelect = (selectedRole: string) => setRole(selectedRole);

  const submitRole = async (selectedRole: "PROVIDER" | "CLIENT") => {
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        router.push("/signIn");
        return;
      }

      const response = await axiosInstance.post(
        `/users/set-role`,
        { role: selectedRole },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          } 
        }
      );

      // Use the backend's redirectTo if provided, otherwise use default logic
      const redirectTo = response?.data?.redirectTo;
      if (redirectTo) {
        // For CLIENT role, use window.location.href to force a full page reload
        // This ensures UserContext and other cached state is refreshed
        if (selectedRole === "CLIENT") {
          writeAuthIntentRole(null);
          window.location.href = redirectTo;
        } else {
          writeAuthIntentRole(null);
          router.push(redirectTo);
        }
      } else {
        // Fallback to default redirects
        if (selectedRole === "PROVIDER") {
          writeAuthIntentRole(null);
          router.push("/provider/home");
        } else if (selectedRole === "CLIENT") {
          // Force full page reload for CLIENT to clear cached state
          writeAuthIntentRole(null);
          window.location.href = "/client/home";
        }
      }
    } catch (error: any) {
      console.error("Error setting role:", {
        error,
        response: error?.response,
        data: error?.response?.data,
        status: error?.response?.status,
        message: error?.message,
        stack: error?.stack,
      });
      // Use sanitizeErrorMessage to get user-friendly error message
      const userMessage = sanitizeErrorMessage(error, {
        action: "save your role selection",
        defaultMessage: t("onboarding.error_generic") || "Unable to save your choice. Please try again."
      });
      
      // Redirect to sign in if authentication error
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        router.push("/signIn");
      }
      
      // Use toast for better UX instead of alert
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRole = async () => {
    if (role !== "PROVIDER" && role !== "CLIENT") return;
    await submitRole(role);
  };

  // If user has no role yet, and we know the intended role, auto-submit to make onboarding “one-click”.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    if (userLoading) return;
    if (!userRole) return; // wait for context to populate

    if (userRole === "NONE" && intentRole && !didAutoSubmitRef.current) {
      didAutoSubmitRef.current = true;
      setRole(intentRole);
      submitRole(intentRole).catch(() => {
        // If auto-submit fails, keep the UI available for manual retry.
        didAutoSubmitRef.current = false;
      });
    }
  }, [userRole, userLoading, intentRole]);

  // Show loading state while checking current role
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Smooth path: if user came from a dedicated auth entry, auto-setting role should feel instant.
  if (isSubmitting && intentRole && (userRole === "NONE" || !userRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-md">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 text-sm font-medium">
            {t("onboarding.setting_up") || "Setting up your account..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="button" />
      </div>

      <div className="relative w-full max-w-2xl">
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#FFD6C9] blur-3xl opacity-60" />
        <div className="pointer-events-none absolute -bottom-16 -right-6 w-40 h-40 rounded-full bg-[#C8E3F8] blur-3xl opacity-60" />

        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-[#f5eae0] px-6 py-8 sm:px-10 sm:py-10">
          {/* Back Button - Inside the card */}
          <div className="absolute top-6 left-6 sm:top-8 sm:left-8">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
              aria-label={t("common.back")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

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

const OnboardingPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
};

export default OnboardingPage;
