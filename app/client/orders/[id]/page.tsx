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
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
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

        if (response.data) setOrders(response.data);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setError("Failed to fetch orders. Please try again later.");
      }
    };

    fetchOrders();
  }, [router]);

  // Group orders by status
  const confirmedOrders = orders.filter(o => o.status === "confirmed");
  const pendingOrders = orders.filter(o => o.status === "pending");
  const cancelledOrders = orders.filter(o => o.status === "cancelled");

  const hasOrders = orders.length > 0;

  return (
    <main className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <div className="w-full flex justify-center mb-6 pt-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
          My Orders
        </h1>
      </div>

      <div className="w-full max-w-3xl flex flex-col gap-6 px-4">
        {!hasOrders && (
          <p className="text-gray-600 text-center">You have not placed any orders yet.</p>
        )}

        {confirmedOrders.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Confirmed Orders</h2>
            <div className="flex flex-col gap-4">
              {confirmedOrders.map(order => (
                <CartOrder key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {pendingOrders.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Pending Orders</h2>
            <div className="flex flex-col gap-4">
              {pendingOrders.map(order => (
                <CartOrder key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}

        {cancelledOrders.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Cancelled Orders</h2>
            <div className="flex flex-col gap-4">
              {cancelledOrders.map(order => (
                <CartOrder key={order.id} order={order} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Orders;
