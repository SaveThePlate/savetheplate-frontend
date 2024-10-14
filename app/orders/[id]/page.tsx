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
  const router = useRouter();
  const params = useParams();  
  
  const { id } = params;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => { 
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("No access token found, please log in again.");
      return router.push("/signIn");
    }

    console.log("id ", id);
    axios.get(`http://localhost:3001/orders/user/${id}`, { 
      headers: { Authorization: `Bearer ${token}` },
    })
    .then(response => {
      console.log('response.data ',response.data);
      if (response.data) setOrders(response.data);
      console.log("orders ", orders);
    })
  }, [id, router, orders]);


  return (
    <main className="pt-16 sm:pt-32 p-6 min-h-screen items-center">

      <div className="w-full flex justify-center mb-6 pt-6">
        <Button className="text-lg font-bold">My Orders</Button>
      </div>

      <div className="items-container">
      {orders.length > 0 ? (
          orders.map((order) => (
            <CartOrder key={order.id} order={order} />
          ))
        ) : (
          <p>No orders yet.</p>
        )}
      </div>
    </main>
  );
};

export default Orders;
