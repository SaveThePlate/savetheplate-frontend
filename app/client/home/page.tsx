"use client";

import React, { useEffect, useState, useRef } from "react";
import Offers from "@/components/Offers";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch offers function - can be called to refresh
  const fetchOffers = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      let userId: string | undefined;
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        userId = tokenPayload?.id;
      } catch (error) {
        console.error("Error parsing token:", error);
        // Try to get userId from API if token parsing fails
        try {
          const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers });
          userId = userResponse.data?.id;
        } catch (apiError) {
          console.error("Error fetching user info:", apiError);
        }
      }

      // Add cache-busting timestamp to ensure fresh data
      const timestamp = Date.now();

      // Fetch offers and pending orders in parallel for faster loading
      // Use fetch instead of axios to avoid automatic cache-control headers
      const [offersResponse, ordersResponse] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers?t=${timestamp}`, {
          method: 'GET',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          // Don't use credentials: 'include' - we use Bearer tokens, not cookies
          // Using credentials with CORS requires specific origin, not wildcard
        }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${userId}?t=${timestamp}`, { headers }),
      ]);

      if (!isMountedRef.current) return;

      // Process offers (critical - show immediately)
      if (offersResponse.status === "fulfilled") {
        // fetch returns data directly, axios returns { data }
        const offersData = offersResponse.value;
        setOffers(offersData);
        setError(null);
      } else {
        console.error("Failed to fetch offers:", offersResponse.reason);
        if (!isRefresh && isMountedRef.current) {
          const errorMsg = sanitizeErrorMessage(offersResponse.reason, {
            action: "load offers",
            defaultMessage: t("client.home.fetch_offers_failed") || "Unable to load offers. Please try again later."
          });
          setError(errorMsg);
        }
      }

      // Process pending orders (non-critical - can fail silently)
      if (ordersResponse.status === "fulfilled") {
        const pending = (ordersResponse.value.data || []).filter(
          (o: any) => o.status === "pending"
        ).length;
        if (isMountedRef.current) {
          setPendingCount(pending);
        }
      } else {
        console.debug("Could not fetch pending orders", ordersResponse.reason);
      }
    } catch (fetchError) {
      console.error("Failed to fetch data:", fetchError);
      if (!isRefresh && isMountedRef.current) {
        const errorMsg = sanitizeErrorMessage(fetchError, {
          action: "load offers",
          defaultMessage: "Unable to load offers. Please check your connection and try again."
        });
        setError(errorMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [router, t]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <main className="flex flex-col items-center w-full">
      <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-6xl pt-4 sm:pt-6 space-y-6 sm:space-y-8 relative">
        {/* Decorative soft shapes */}
        <div className="absolute top-0 left-[-4rem] w-40 h-40 bg-[#FFD6C9] rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-10 right-[-3rem] w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-40 -z-10" />

        {/* Pending Orders Banner */}
        {pendingCount > 0 && (
          <div data-tour="pending-orders" className="bg-[#FFF5DA] border border-[#FFE7A0] text-[#7C5A00] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
            <div>
              <p className="font-semibold text-base sm:text-lg">
                🍱 {pendingCount === 1 
                  ? t("home.pending_orders_single", { count: pendingCount })
                  : t("home.pending_orders_plural", { count: pendingCount })}
              </p>
              <p className="text-sm text-[#A68200]">
                {t("home.pending_reminder")}
              </p>
            </div>
            <Button
              onClick={() => {
                const token = localStorage.getItem("accessToken");
                if (!token) return router.push("/signIn");
                try {
                  const tokenPayload = JSON.parse(atob(token.split(".")[1]));
                  const uid = tokenPayload?.id;
                  if (uid) {
                    router.push(`/client/orders/${uid}`);
                  } else {
                    router.push("/client/orders");
                  }
                } catch {
                  router.push("/client/orders");
                }
              }}
              className="bg-[#FFAE8A] hover:bg-[#ff9966] text-white rounded-xl px-5 py-2.5 sm:py-2 transition-all duration-200 min-h-[44px] sm:min-h-0"
            >
              {t("home.view_orders")}
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="text-left space-y-1 sm:space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#344e41] tracking-tight">
              {t("offers.available_offers")}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base font-medium">
              {t("offers.discover_meals")}
            </p>
          </div>
          <button
            data-tour="refresh-button"
            onClick={() => fetchOffers(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            title="Refresh offers to see latest available meals"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </button>
        </div>

        {/* Offers List */}
        <section data-tour="offers-section" className="relative min-h-[50vh]">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-500 bg-white/70 backdrop-blur-sm border border-[#f5eae0] rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 md:p-8">
              <Loader2 className="animate-spin w-6 h-6 mr-2" />
              {t("common.loading")}
            </div>
          ) : error ? (
            <div className="bg-white/70 backdrop-blur-sm border border-red-200 rounded-2xl sm:rounded-3xl shadow-sm p-4 sm:p-6 md:p-8">
              <p className="text-center text-red-600">{error}</p>
            </div>
          ) : (
            <Offers />
          )}
        </section>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out;
        }
      `}</style>
    </main>
  );
};

export default Home;
