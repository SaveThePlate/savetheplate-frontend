"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import CartOrder from "@/components/cartOrder";
import { useRouter } from "next/navigation";

type Order = {
  id: number;
  quantity: number;
  userId: number;
  offerId: number;
  createdAt: string;
  status: string;
  mapsLink?: string;
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found, please log in again.");
        router.push("/signIn");
        return;
      }

      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const userId = tokenPayload.id;

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${userId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setOrders(response.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to fetch orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const hasOrders = orders.length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center pt-24 pb-16 bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6 lg:px-16">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#344e41] tracking-tight">
            My Orders
          </h1>
          <p className="text-gray-600 text-sm sm:text-base font-medium">
            Review your meals and track your orders 🍃
          </p>
        </div>

        {/* Orders List */}
        <section className="space-y-6">
          {loading ? (
            <p className="text-center text-gray-500 py-20">Loading orders...</p>
          ) : error ? (
            <p className="text-center text-red-600 py-20">{error}</p>
          ) : !hasOrders ? (
            <p className="text-center text-gray-500 py-20">
              You have no orders yet. Start rescuing meals 🌿
            </p>
          ) : (
            <>
              {pendingOrders.length > 0 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#C79B32] mb-4 flex items-center gap-2">
                    Pending Orders
                  </h2>
                  <div className="flex flex-col gap-4">
                    {pendingOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-4 border border-[#FFE7A0]">
                        <CartOrder order={order} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {confirmedOrders.length > 0 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#4B944F] mb-4 flex items-center gap-2">
                    Confirmed Orders
                  </h2>
                  <div className="flex flex-col gap-4">
                    {confirmedOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-4 border border-[#A4D8A4]">
                        <CartOrder order={order} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cancelledOrders.length > 0 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#D9534F] mb-4 flex items-center gap-2">
                    Cancelled Orders
                  </h2>
                  <div className="flex flex-col gap-4">
                    {cancelledOrders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-4 border border-[#F5B5B5]">
                        <CartOrder order={order} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
};

export default Orders;
