"use client";

import React, { useEffect, useState } from "react";
import Offers from "@/components/Offers";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<{ id: number; title: string; latitude: number; longitude: number }[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

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
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const userId = tokenPayload.id;

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

      // Process offers (critical - show immediately)
      if (offersResponse.status === "fulfilled") {
        // fetch returns data directly, axios returns { data }
        const offersData = offersResponse.value;
        setOffers(offersData);
        setError(null);
      } else {
        console.error("Failed to fetch offers:", offersResponse.reason);
        if (!isRefresh) {
          setError(t("client.home.fetch_offers_failed"));
        }
      }

      // Process pending orders (non-critical - can fail silently)
      if (ordersResponse.status === "fulfilled") {
        const pending = (ordersResponse.value.data || []).filter(
          (o: any) => o.status === "pending"
        ).length;
        setPendingCount(pending);
      } else {
        console.debug("Could not fetch pending orders", ordersResponse.reason);
      }
    } catch (fetchError) {
      console.error("Failed to fetch data:", fetchError);
      if (!isRefresh) {
        setError("Failed to fetch offers. Please try again later.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <main className="min-h-screen flex flex-col items-center pt-24 pb-20 bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE]">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 space-y-8 relative">
        {/* Decorative soft shapes */}
        <div className="absolute top-0 left-[-4rem] w-40 h-40 bg-[#FFD6C9] rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-10 right-[-3rem] w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-40 -z-10" />

        {/* Pending Orders Banner */}
        {pendingCount > 0 && (
          <div className="bg-[#FFF5DA] border border-[#FFE7A0] text-[#7C5A00] rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
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
                  const uid = JSON.parse(atob(token.split(".")[1])).id;
                  router.push(`/client/orders/${uid}`);
                } catch {
                  router.push("/client/orders");
                }
              }}
              className="bg-[#FFAE8A] hover:bg-[#ff9966] text-white rounded-xl px-5 py-2 transition-all duration-200"
            >
              {t("home.view_orders")}
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-2 flex-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#344e41] tracking-tight">
              {t("offers.available_offers")}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base font-medium">
              {t("offers.discover_meals")}
            </p>
          </div>
          <button
            onClick={() => fetchOffers(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh offers to see latest available meals"
          >
            <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{t("common.refresh")}</span>
          </button>
        </div>

        {/* Offers List */}
        <section className="relative min-h-[50vh] bg-white/70 backdrop-blur-sm border border-[#f5eae0] rounded-3xl shadow-sm p-5 sm:p-8 transition-all duration-300 hover:shadow-md">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 mr-2" />
              {t("common.loading")}
            </div>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
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
