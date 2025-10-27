"use client";

import React, { useEffect, useState } from "react";
import Offers from "@/components/Offers";
import MapComponent from "@/components/MapComponent";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
          setError("No access token found");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setOffers(response.data);
        // also check pending orders for current user
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          const userId = tokenPayload.id;
          const ordRes = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${userId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const pending = (ordRes.data || []).filter((o: any) => o.status === 'pending').length;
          setPendingCount(pending);
        } catch (e) {
          // ignore pending fetch errors — it's non-blocking for offers
          console.debug('Could not fetch pending orders', e);
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
    <main className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 flex flex-col space-y-6">
        {pendingCount > 0 && (
          <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <strong>You have {pendingCount} pending order{pendingCount > 1 ? 's' : ''}.</strong>
              <div className="text-sm text-yellow-700">Remember to collect and confirm your orders.</div>
            </div>
            <div>
              <Button onClick={() => {
                const token = localStorage.getItem('accessToken');
                if (!token) return router.push('/signIn');
                try {
                  const uid = JSON.parse(atob(token.split('.')[1])).id;
                  router.push(`/client/orders/${uid}`);
                } catch { router.push('/client/orders'); }
              }} className="bg-yellow-100 text-yellow-900">View Orders</Button>
            </div>
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">Available Offers</h1>
        <Offers />
      </div>
    </main>
  );
};

export default Home;
