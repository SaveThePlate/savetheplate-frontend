"use client";

import { useEffect, useState, useCallback } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import CartOrder from "@/components/cartOrder";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
// WEBSOCKET INTEGRATION TEMPORARILY DISABLED
// import { useWebSocket } from "@/hooks/useWebSocket";

type Order = {
  id: number;
  quantity: number;
  userId: number;
  offerId: number;
  createdAt: string;
  status: string;
  mapsLink?: string;
  qrCodeToken?: string;
  collectedAt?: string;
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  // Fetch orders function - can be called to refresh
  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError(t("client.orders.error_auth"));
      router.push("/signIn");
      return;
    }

    try {
      let currentUserId;
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        currentUserId = tokenPayload.id;
        setUserId(currentUserId);
      } catch (parseError) {
        console.error("Error parsing token:", parseError);
        setError("Invalid authentication. Please sign in again.");
        router.push("/signIn");
        return;
      }

      const response = await axiosInstance.get(
        `/orders/user/${currentUserId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders(response.data);
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      // Provide user-friendly error message
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        setError(t("client.orders.error_auth"));
        router.push("/signIn");
      } else {
        setError(t("client.orders.error_fetch"));
      }
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // WEBSOCKET INTEGRATION TEMPORARILY DISABLED - Using manual refresh instead
  // Handle real-time order updates
  // const handleOrderUpdate = useCallback((data: { type: string; order: any }) => {
  //   const { type, order } = data;
  //   
  //   // Only process updates for orders that belong to this user
  //   if (userId && order.userId !== userId) {
  //     console.log(`📦 Order update ignored: order.userId (${order.userId}) !== current userId (${userId})`);
  //     return;
  //   }
  //   
  //   console.log(`📦 Order update received:`, { type, orderId: order.id, status: order.status, orderUserId: order.userId, currentUserId: userId });
  //   
  //   setOrders((prevOrders) => {
  //     // Ensure prevOrders is always an array
  //     const safePrevOrders = Array.isArray(prevOrders) ? prevOrders : [];
  //     
  //     if (type === 'created') {
  //       // Add new order if it belongs to this user
  //       if (order.userId === userId) {
  //         console.log(`➕ Adding new order: ${order.id}`);
  //         return [order, ...safePrevOrders];
  //       }
  //       return safePrevOrders;
  //     } else if (type === 'updated') {
  //       // Update existing order only if it exists in the list
  //       const orderExists = safePrevOrders.some((o) => o.id === order.id);
  //       if (orderExists) {
  //         console.log(`🔄 Updating order: ${order.id} from ${safePrevOrders.find(o => o.id === order.id)?.status} to ${order.status}`);
  //         return safePrevOrders.map((o) => (o.id === order.id ? order : o));
  //       } else if (order.userId === userId) {
  //         // If order doesn't exist but belongs to user, add it
  //         console.log(`➕ Adding missing order: ${order.id}`);
  //         return [order, ...safePrevOrders];
  //       }
  //       return safePrevOrders;
  //     } else if (type === 'deleted') {
  //       // Remove deleted order
  //       console.log(`🗑️ Removing order: ${order.id}`);
  //       return safePrevOrders.filter((o) => o.id !== order.id);
  //     }
  //     return safePrevOrders;
  //   });

  //   // Show toast notification when order is confirmed
  //   if (type === 'updated' && order.status === 'confirmed') {
  //     console.log(`✅ Order confirmed: ${order.id}`);
  //     toast.success(t("orders.confirmed") || "Order confirmed successfully!");
  //   }
  // }, [userId, t]);

  // Connect to WebSocket for real-time updates
  // useWebSocket({
  //   onOrderUpdate: handleOrderUpdate,
  //   enabled: true,
  // });

  // Handle order cancellation - update order status instantly
  const handleOrderCancelled = useCallback((orderId: number) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: "cancelled" } : order
      )
    );
  }, []);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const hasOrders = orders.length > 0;
  const totalOrders = orders.length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-transparent backdrop-blur-md border-b border-border/50 px-3 sm:px-4 py-4">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
            {t("client.orders.my_orders")}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t("client.orders.track_orders")}
          </p>
        </div>
      </header>

      <div className="px-3 sm:px-4 pt-4 sm:pt-6 pb-4 sm:pb-6 space-y-6 border-b border-border/50">
        {/* Stats Cards */}
        {hasOrders && (
          <div className="grid grid-cols-3 gap-2 sm:gap-2">
            {pendingOrders.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-2 sm:p-3 border border-amber-200/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-amber-600 text-white flex items-center justify-center mb-1 flex-shrink-0">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="text-base sm:text-lg font-bold text-amber-900">{pendingOrders.length}</div>
                <div className="text-[9px] sm:text-[10px] text-amber-700 font-medium mt-0.5">
                  {t("orders.pending")}
                </div>
              </div>
            )}
            {confirmedOrders.length > 0 && (
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-2 sm:p-3 border border-emerald-200/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-emerald-600 text-white flex items-center justify-center mb-1 flex-shrink-0">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="text-base sm:text-lg font-bold text-emerald-900">{confirmedOrders.length}</div>
                <div className="text-[9px] sm:text-[10px] text-emerald-700 font-medium mt-0.5">
                  {t("orders.confirmed")}
                </div>
              </div>
            )}
            {cancelledOrders.length > 0 && (
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-2 sm:p-3 border border-red-200/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-red-600 text-white flex items-center justify-center mb-1 flex-shrink-0">
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="text-base sm:text-lg font-bold text-red-900">{cancelledOrders.length}</div>
                <div className="text-[9px] sm:text-[10px] text-red-700 font-medium mt-0.5">
                  {t("orders.cancelled")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orders List */}
      <section className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4"></div>
            <p className="text-muted-foreground font-medium">{t("client.orders.loading")}</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-600 text-white flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <XCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <p className="text-red-900 text-base sm:text-lg font-bold mb-2">
              {t("client.orders.error_title")}
            </p>
            <p className="text-sm sm:text-base text-red-800 mb-6 break-words">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              {t("common.try_again")}
            </Button>
          </div>
        ) : !hasOrders ? (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-8 sm:p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              {t("client.orders.no_orders_title")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
              {t("client.orders.no_orders_message")}
            </p>
            <Button
              onClick={() => router.push("/client/home")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2 sm:py-3 rounded-lg font-medium"
            >
              {t("client.orders.explore_offers")}
            </Button>
          </div>
        ) : (
          <>
            {pendingOrders.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground flex-1">
                    {t("client.orders.pending_orders")}
                  </h2>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs sm:text-sm font-semibold">
                    {pendingOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CartOrder order={order} onOrderCancelled={handleOrderCancelled} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {confirmedOrders.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground flex-1">
                    {t("client.orders.confirmed_orders")}
                  </h2>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs sm:text-sm font-semibold">
                    {confirmedOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {confirmedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CartOrder order={order} onOrderCancelled={handleOrderCancelled} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cancelledOrders.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground flex-1">
                    {t("client.orders.cancelled_orders")}
                  </h2>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-semibold">
                    {cancelledOrders.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {cancelledOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-border/50 shadow-sm opacity-75"
                    >
                      <CartOrder order={order} onOrderCancelled={handleOrderCancelled} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Orders;
