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
  const { id } = params;

  useEffect(() => { 
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("No access token found, please log in again.");
      return router.push("/signIn");
    }


    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const id = tokenPayload.id;

    axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + `/orders/user/${id}`, { 
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      if (response.data) setOrders(response.data);
    })
  }, [id, router, orders]);


  return (
    <main className="sm:pt-16 p-6 bg-[#cdeddf] min-h-screen flex flex-col items-center">

      <div className="w-full flex justify-center mb-6 pt-6">
      <h1
            className="text-3xl font-extrabold mb-4"
            style={{
              color: "beige",
              WebkitTextStroke: "1px #000000",
              textShadow: "4px 4px 6px rgba(0, 0, 0, 0.15)",
            }}
          >
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
