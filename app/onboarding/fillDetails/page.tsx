"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

const FillDetails = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [location, setLocation] = useState(""); // extracted restaurant name
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [checkingRole, setCheckingRole] = useState(true);

  // Check if user has PROVIDER role, if not redirect to onboarding
  useEffect(() => {
    const checkRole = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/signIn");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userRole = response?.data?.role;
        // If user doesn't have PROVIDER role, redirect to onboarding (role setting page)
        if (userRole !== 'PROVIDER') {
          router.push("/onboarding");
          return;
        }

        setCheckingRole(false);
      } catch (error) {
        console.error("Error checking role:", error);
        router.push("/onboarding");
      }
    };

    checkRole();
  }, [router]);

  // Clean and extract Google Maps URL from pasted text
  const cleanGoogleMapsUrl = (text: string): string => {
    if (!text.trim()) return "";
    
    // Remove any leading/trailing whitespace
    text = text.trim();
    
    // Try to find a Google Maps URL in the text
    // Pattern 1: Full URLs (maps.google.com, google.com/maps, goo.gl/maps, maps.app.goo.gl)
    const urlPattern = /(https?:\/\/)?(www\.)?(maps\.)?(google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.google\.com)[^\s]*/gi;
    const urlMatch = text.match(urlPattern);
    if (urlMatch && urlMatch[0]) {
      let url = urlMatch[0];
      // Ensure it starts with http:// or https://
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      // Remove any trailing characters that aren't part of the URL
      url = url.replace(/[.,;!?]+$/, "");
      return url;
    }
    
    // Pattern 2: Short links (goo.gl, maps.app.goo.gl)
    const shortLinkPattern = /(https?:\/\/)?(goo\.gl|maps\.app\.goo\.gl)\/[a-zA-Z0-9]+/gi;
    const shortMatch = text.match(shortLinkPattern);
    if (shortMatch && shortMatch[0]) {
      let url = shortMatch[0];
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      return url;
    }
    
    // If no URL pattern found, return the text as-is (might be a valid URL format we don't recognize)
    return text;
  };

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // --- Extract location name for preview with debouncing
  const fetchLocationName = useCallback(async (url: string) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!url.trim()) {
      // Don't clear location if user has manually edited it
      return;
    }

    // Clean the URL first
    const cleanedUrl = cleanGoogleMapsUrl(url);
    if (!cleanedUrl) {
      return;
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = localStorage.getItem("accessToken") || "";
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/extract-location`,
        { mapsLink: cleanedUrl },
        { 
          headers: { Authorization: `Bearer ${token}` },
          signal: abortController.signal,
        }
      );

      // Check if request was aborted
      if (abortController.signal.aborted) return;

      const { locationName } = response.data;
      // Only update if we got a location name
      if (locationName) {
        setLocation(locationName);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === 'AbortError' || error.name === 'CanceledError') {
        return;
      }
      console.error("Error extracting location name:", error);
      // Don't clear location on error - preserve user's manual edits
    }
  }, []);

  const handleGoogleMapsLinkChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Clean the URL and set it
    const cleanedUrl = cleanGoogleMapsUrl(inputValue);
    setMapsLink(cleanedUrl || inputValue);
    
    // Clear previous debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce API call by 500ms
    debounceTimerRef.current = setTimeout(() => {
      fetchLocationName(cleanedUrl || inputValue);
    }, 500);
  }, [fetchLocationName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle paste events to clean the URL
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const cleanedUrl = cleanGoogleMapsUrl(pastedText);
    if (cleanedUrl && cleanedUrl !== pastedText) {
      e.preventDefault();
      setMapsLink(cleanedUrl);
      fetchLocationName(cleanedUrl);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      if (!mapsLink.trim()) {
        toast.error(t("onboarding.maps_required"));
        return;
      }

      const normalizedPhone = phoneNumber.trim();
      if (!/^\d{8}$/.test(normalizedPhone)) {
        toast.error(t("onboarding.phone_invalid"));
        return;
      }

      const data: any = {
        phoneNumber: normalizedPhone,
        mapsLink: mapsLink.trim(),
      };

      // Include location if user has set it (either extracted or manually edited)
      if (location && location.trim()) {
        data.location = location.trim();
      }

      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/update-details`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(t("onboarding.details_success"));
      router.push("/onboarding/thank-you");
    } catch (error) {
      console.error("Error adding restaurant details:", error);
      toast.error(t("onboarding.details_error"));
    }
  };

  // Show loading state while checking role
  if (checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

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

        <div className="relative z-10 w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-[#f5eae0] px-6 py-8 sm:px-10 sm:py-10">

          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-emerald-600">
              {t("onboarding.step_2_of_2")}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#344E41]">
              {t("onboarding.add_location")}
            </h1>
            <p className="text-gray-700 text-sm sm:text-base max-w-md mx-auto">
              {t("onboarding.location_help")}
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProfileUpdate();
            }}
            className="grid grid-cols-1 gap-5 text-left"
          >
            <div className="space-y-1">
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700"
              >
                {t("onboarding.phone_number")}
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#A8DADC] focus:border-[#A8DADC]"
                placeholder={t("onboarding.phone_placeholder")}
                required
              />
              <p className="text-xs text-gray-500">
                {t("onboarding.phone_hint")}
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="googleMapsLink"
                className="block text-sm font-medium text-gray-700"
              >
                {t("onboarding.google_maps_link")}
              </label>
              <Input
                id="googleMapsLink"
                value={mapsLink}
                onChange={handleGoogleMapsLinkChange}
                onPaste={handlePaste}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#FFAE8A] focus:border-[#FFAE8A]"
                placeholder={t("onboarding.maps_placeholder")}
                required
              />
              <p className="text-xs text-gray-500">
                {t("onboarding.maps_hint")}
              </p>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700"
              >
                {t("onboarding.location_name")}
              </label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#A8DADC] focus:border-[#A8DADC]"
                placeholder={t("onboarding.detected_placeholder")}
              />
              <p className="text-xs text-gray-500">
                {t("onboarding.location_hint")}
              </p>
            </div>

            <Button
              type="submit"
              className="mt-2 w-full bg-[#A8DADC] hover:bg-[#92C7C9] text-[#1D3557] font-semibold py-3 rounded-full transition-all duration-300 shadow-sm"
            >
              {t("onboarding.submit_details")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FillDetails;
