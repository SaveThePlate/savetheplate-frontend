"use client";

import React, { useEffect, useState } from "react";
import Offers from "@/components/Offers";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<
    { id: number; title: string; latitude: number; longitude: number }[]
  >([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
        router.push("/signIn");
        return;
        }
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOffers(response.data);

        // fetch pending orders
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          const userId = tokenPayload.id;
          const ordRes = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const pending = (ordRes.data || []).filter(
            (o: any) => o.status === "pending"
          ).length;
          setPendingCount(pending);
        } catch (e) {
          console.debug("Could not fetch pending orders", e);
        }
      } catch (fetchError) {
        console.error("Failed to fetch offers:", fetchError);
        setError("Failed to fetch offers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

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
                🍱 You have {pendingCount} pending order
                {pendingCount > 1 ? "s" : ""}.
              </p>
              <p className="text-sm text-[#A68200]">
                Don’t forget to collect and confirm them on time!
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
              View Orders
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="text-center sm:text-left space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#344e41] tracking-tight">
            Available Offers
          </h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium">
            Discover local meals ready to be rescued 🍃
          </p>
        </div>

        {/* Offers List */}
        <section className="relative min-h-[50vh] bg-white/70 backdrop-blur-sm border border-[#f5eae0] rounded-3xl shadow-sm p-5 sm:p-8 transition-all duration-300 hover:shadow-md">
          {loading ? (
            <div className="flex justify-center items-center h-64 text-gray-500">
              <Loader2 className="animate-spin w-6 h-6 mr-2" />
              Loading offers...
            </div>
          ) : error ? (
            <p className="text-center text-red-600">{error}</p>
          ) : offers.length > 0 ? (
            <Offers />
          ) : (
            <p className="text-center text-gray-500 font-medium py-10">
              No offers available right now. Check back soon 🌿
            </p>
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
