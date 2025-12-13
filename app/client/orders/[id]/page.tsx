"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import CartOrder from "@/components/cartOrder";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { toast, ToastContainer } from "react-toastify";

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

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${currentUserId}`,
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

  // Handle real-time order updates
  const handleOrderUpdate = useCallback((data: { type: string; order: any }) => {
    const { type, order } = data;
    
    // Only process updates for orders that belong to this user
    if (userId && order.userId !== userId) {
      console.log(`📦 Order update ignored: order.userId (${order.userId}) !== current userId (${userId})`);
      return;
    }
    
    console.log(`📦 Order update received:`, { type, orderId: order.id, status: order.status, orderUserId: order.userId, currentUserId: userId });
    
    setOrders((prevOrders) => {
      // Ensure prevOrders is always an array
      const safePrevOrders = Array.isArray(prevOrders) ? prevOrders : [];
      
      if (type === 'created') {
        // Add new order if it belongs to this user
        if (order.userId === userId) {
          console.log(`➕ Adding new order: ${order.id}`);
          return [order, ...safePrevOrders];
        }
        return safePrevOrders;
      } else if (type === 'updated') {
        // Update existing order only if it exists in the list
        const orderExists = safePrevOrders.some((o) => o.id === order.id);
        if (orderExists) {
          console.log(`🔄 Updating order: ${order.id} from ${safePrevOrders.find(o => o.id === order.id)?.status} to ${order.status}`);
          return safePrevOrders.map((o) => (o.id === order.id ? order : o));
        } else if (order.userId === userId) {
          // If order doesn't exist but belongs to user, add it
          console.log(`➕ Adding missing order: ${order.id}`);
          return [order, ...safePrevOrders];
        }
        return safePrevOrders;
      } else if (type === 'deleted') {
        // Remove deleted order
        console.log(`🗑️ Removing order: ${order.id}`);
        return safePrevOrders.filter((o) => o.id !== order.id);
      }
      return safePrevOrders;
    });

    // Show toast notification when order is confirmed
    if (type === 'updated' && order.status === 'confirmed') {
      console.log(`✅ Order confirmed: ${order.id}`);
      toast.success(t("orders.confirmed") || "Order confirmed successfully!");
    }
  }, [userId, t]);

  // Connect to WebSocket for real-time updates
  useWebSocket({
    onOrderUpdate: handleOrderUpdate,
    enabled: true,
  });

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const hasOrders = orders.length > 0;
  const totalOrders = orders.length;

  return (
    <main className="flex flex-col items-center w-full">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        limit={3}
        toastClassName="bg-emerald-600 text-white rounded-xl shadow-lg border-0 px-4 py-3"
        bodyClassName="text-sm font-medium"
        progressClassName="bg-white/80"
      />
      <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-6xl pt-4 sm:pt-6 space-y-6 sm:space-y-8 relative">
        {/* Decorative soft shapes */}
        <div className="absolute top-0 left-[-4rem] w-40 h-40 bg-[#FFD6C9] rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-10 right-[-3rem] w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-40 -z-10" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="text-left space-y-1 sm:space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#344e41] tracking-tight">
              {t("client.orders.my_orders")}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base font-medium">
              {t("client.orders.track_orders")}
            </p>
          </div>
          {hasOrders && (
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 flex-shrink-0">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                {totalOrders} {totalOrders === 1 ? t("client.orders.order") : t("client.orders.orders")}
              </span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {hasOrders && (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {pendingOrders.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-3 sm:p-4 shadow-sm">
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
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-3 sm:p-4 shadow-sm">
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
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-3 sm:p-4 shadow-sm xs:col-span-2 sm:col-span-1">
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
        <section className="relative min-h-[50vh] space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-gray-600 text-lg font-medium">{t("client.orders.loading")}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 sm:p-8 text-center">
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
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-6 sm:p-8 md:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 px-2">{t("client.orders.no_orders_title")}</h2>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-2">
                {t("client.orders.no_orders_message")}
              </p>
              <Button
                onClick={() => router.push("/client/home")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                {t("client.orders.explore_offers")}
              </Button>
            </div>
          ) : (
            <>
              {pendingOrders.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-700" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex-1 min-w-0">
                      <span className="break-words">{t("client.orders.pending_orders")}</span>
                    </h2>
                    <span className="px-2 sm:px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0">
                      {pendingOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {pendingOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-yellow-400"
                      >
                        <CartOrder order={order} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {confirmedOrders.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex-1 min-w-0">
                      <span className="break-words">{t("client.orders.confirmed_orders")}</span>
                    </h2>
                    <span className="px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0">
                      {confirmedOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {confirmedOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-emerald-400"
                      >
                        <CartOrder order={order} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cancelledOrders.length > 0 && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex-1 min-w-0">
                      <span className="break-words">{t("client.orders.cancelled_orders")}</span>
                    </h2>
                    <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-semibold flex-shrink-0">
                      {cancelledOrders.length}
                    </span>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                    {cancelledOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow border-l-4 border-red-400 opacity-75"
                      >
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
