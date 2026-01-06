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
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const currentUserId = tokenPayload.id;
      setUserId(currentUserId);

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
    <div className="min-h-screen pb-24 px-4 pt-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-2">{t("client.orders.my_orders")}</h1>
        <p className="text-muted-foreground text-sm">{t("client.orders.track_orders")}</p>
      </div>
      {/* Stats Cards */}
      {hasOrders && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {pendingOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-yellow-800">{pendingOrders.length}</p>
                      <p className="text-xs sm:text-sm text-yellow-700 font-medium truncate">{t("orders.pending")}</p>
                    </div>
                  </div>
                </div>
              )}
          {confirmedOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-emerald-800">{confirmedOrders.length}</p>
                      <p className="text-xs sm:text-sm text-emerald-700 font-medium truncate">{t("orders.confirmed")}</p>
                    </div>
                  </div>
                </div>
              )}
          {cancelledOrders.length > 0 && (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-bold text-red-800">{cancelledOrders.length}</p>
                      <p className="text-xs sm:text-sm text-red-700 font-medium truncate">{t("orders.cancelled")}</p>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

      {/* Orders List */}
      <section className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-muted-foreground text-lg font-medium">{t("client.orders.loading")}</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl border border-destructive/20 p-6 text-center">
              <XCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-red-800 text-base sm:text-lg font-semibold mb-2 px-2">{t("client.orders.error_title")}</p>
              <p className="text-sm sm:text-base text-red-600 mb-4 px-2 break-words">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
              >
                {t("common.try_again")}
              </Button>
            </div>
          ) : !hasOrders ? (
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t("client.orders.no_orders_title")}</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {t("client.orders.no_orders_message")}
              </p>
              <Button
                onClick={() => router.push("/client/home")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl font-medium"
              >
                {t("client.orders.explore_offers")}
              </Button>
            </div>
          ) : (
            <>
              {pendingOrders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-yellow-700" />
                    </div>
                    <h2 className="text-xl font-bold flex-1">
                      {t("client.orders.pending_orders")}
                    </h2>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      {pendingOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                      >
                        <CartOrder order={order} onOrderCancelled={handleOrderCancelled} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

          {confirmedOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-emerald-700" />
                </div>
                <h2 className="text-xl font-bold flex-1">
                  {t("client.orders.confirmed_orders")}
                </h2>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                  {confirmedOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {confirmedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CartOrder order={order} onOrderCancelled={handleOrderCancelled} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {cancelledOrders.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-5 h-5 text-red-700" />
                </div>
                <h2 className="text-xl font-bold flex-1">
                  {t("client.orders.cancelled_orders")}
                </h2>
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                  {cancelledOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {cancelledOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-border shadow-sm opacity-75"
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
