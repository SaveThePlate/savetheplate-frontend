"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import CartOrder from "@/components/cartOrder"; 
import { useParams, useRouter } from "next/navigation";
import { Button } from '@/components/ui/button';


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
  const params = useParams();
  // `params.id` may be present in the route but we want the currently authenticated user's orders.

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
    // only run on mount (and when router changes)
  }, [router]);


  return (
    <main className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">

      <div className="w-full flex justify-center mb-6 pt-6">
      <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
        My Orders
      </h1>
      </div>

      <div className="items-container">
      {/* {orders.length > 0 ? (
          orders.map((order) => (
            <CartOrder key={order.id} order={order} />
          ))
        ) : (
          <p>No orders yet.</p>
        )} */}
        {orders.map((order) => (
            <CartOrder key={order.id} order={order} />
          ))}
      </div>
    </main>
  );
};

export default Orders;
