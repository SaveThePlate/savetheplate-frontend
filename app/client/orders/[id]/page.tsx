"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import CartOrder from "@/components/cartOrder";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, XCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

type Order = {
  id: number;
  quantity: number;
  userId: number;
  offerId: number;
  createdAt: string;
  status: string;
  mapsLink?: string;
  qrCodeToken?: string;
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError(t("client.orders.loading"));
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
        setError(t("client.orders.loading"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router, t]);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const confirmedOrders = orders.filter((o) => o.status === "confirmed");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");

  const hasOrders = orders.length > 0;
  const totalOrders = orders.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#F9FAF5] via-[#F0F7F4] to-[#F9FAF5] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#1B4332] mb-2 flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                {t("client.orders.my_orders")}
              </h1>
              <p className="text-gray-600 text-base sm:text-lg">
                {t("client.orders.track_orders")}
              </p>
            </div>
            {hasOrders && (
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <Package className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-semibold text-gray-700">
                  {totalOrders} {totalOrders === 1 ? t("client.orders.order") : t("client.orders.orders")}
                </span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {hasOrders && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {pendingOrders.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-800">{pendingOrders.length}</p>
                      <p className="text-sm text-yellow-700 font-medium">{t("orders.pending")}</p>
                    </div>
                  </div>
                </div>
              )}
              {confirmedOrders.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-emerald-800">{confirmedOrders.length}</p>
                      <p className="text-sm text-emerald-700 font-medium">{t("orders.confirmed")}</p>
                    </div>
                  </div>
                </div>
              )}
              {cancelledOrders.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-800">{cancelledOrders.length}</p>
                      <p className="text-sm text-red-700 font-medium">{t("orders.cancelled")}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Orders List */}
        <section className="space-y-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-gray-600 text-lg font-medium">{t("client.orders.loading")}</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <p className="text-red-800 text-lg font-semibold mb-2">{t("client.orders.error_title")}</p>
              <p className="text-red-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {t("common.try_again")}
              </Button>
            </div>
          ) : !hasOrders ? (
            <div className="bg-white rounded-3xl shadow-lg border-2 border-gray-100 p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <ShoppingBag className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">{t("client.orders.no_orders_title")}</h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {t("client.orders.no_orders_message")}
              </p>
              <Button
                onClick={() => router.push("/client/home")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {t("client.orders.explore_offers")}
              </Button>
            </div>
          ) : (
            <>
              {pendingOrders.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-700" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {t("client.orders.pending_orders")}
                    </h2>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                      {pendingOrders.length}
                    </span>
                  </div>
                  <div className="space-y-4">
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
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-700" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {t("client.orders.confirmed_orders")}
                    </h2>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-semibold">
                      {confirmedOrders.length}
                    </span>
                  </div>
                  <div className="space-y-4">
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
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-700" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {t("client.orders.cancelled_orders")}
                    </h2>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                      {cancelledOrders.length}
                    </span>
                  </div>
                  <div className="space-y-4">
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
