"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const DEFAULT_PROFILE_IMAGE = "/logo.png";

interface Order {
  id: number;
  quantity: number;
  offerId: number;
  status: string;
  createdAt: string;
  mapsLink?: string;

}

interface Offer {
  id: number;
  title: string;
  images?: { filename: string; alt?: string; url?: string }[];
  pickupLocation: string;
  quantity: number;
  price?: number;
  originalPrice?: number;
  mapsLink?: string;
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
  };
}


const ProfilePage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offersDetails, setOffersDetails] = useState<Record<number, Offer>>({});
  const [loading, setLoading] = useState(true);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [totalMealsSaved, setTotalMealsSaved] = useState<number>(0);
  const [co2Saved, setCo2Saved] = useState<number>(0);
  const [waterSaved, setWaterSaved] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{ username: string; phoneNumber: number | null }>({ username: "", phoneNumber: null });
  const [isSaving, setIsSaving] = useState(false);

  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      const numberValue = value === "" ? null : parseInt(value, 10);
      setFormData((prev) => ({ ...prev, phoneNumber: numberValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      setIsSaving(true);

      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsername(formData.username);
      setPhoneNumber(formData.phoneNumber);
      setIsEditing(false);
      toast.success(t("client.profile.profile_updated"));
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error(t("client.profile.update_failed"));
    } finally {
      setIsSaving(false);
    }
  };

  // Consolidate async logic inside the effect to satisfy react-hooks/exhaustive-deps
  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/signIn");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const userId = JSON.parse(atob(token.split(".")[1])).id;

        // Fetch profile and orders in parallel for faster initial load
        const [profileRes, ordersRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${userId}`, { headers }),
        ]);

        // Show profile immediately
        const { username, phoneNumber, profileImage } = profileRes.data || {};
        setUsername(username || "");
        setPhoneNumber(phoneNumber ?? null);
        setFormData({ username: username || "", phoneNumber: phoneNumber ?? null });
        setProfileImage(profileImage || DEFAULT_PROFILE_IMAGE);

        // Show orders immediately (even without offer details)
        const ordersData = ordersRes.data || [];
        setOrders(ordersData);

        // Fetch all offers in parallel to calculate savings
        if (ordersData.length > 0) {
          const offerPromises = ordersData.map((order: Order) =>
            axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${order.offerId}`, {
              headers,
            }).then((offerRes) => ({
              offerId: order.offerId,
              offer: offerRes.data,
            })).catch((err) => {
              console.error(`Failed to fetch offer ${order.offerId}:`, err);
              return null;
            })
          );

          Promise.all(offerPromises).then((offerResults) => {
            const offersMap: Record<number, any> = {};
            offerResults.forEach((result) => {
              if (result) {
                offersMap[result.offerId] = result.offer;
              }
            });
            setOffersDetails(offersMap);

            // Calculate total savings and environmental impact from confirmed orders
            const confirmedOrders = ordersData.filter((o: Order) => o.status === "confirmed");
            let savings = 0;
            let mealsSaved = 0;
            
            confirmedOrders.forEach((order: Order) => {
              const offer = offersMap[order.offerId];
              if (offer) {
                // Calculate financial savings
                if (offer.originalPrice && offer.price && offer.originalPrice > offer.price) {
                  const savingsPerItem = offer.originalPrice - offer.price;
                  savings += savingsPerItem * order.quantity;
                }
                // Each order quantity represents meals/bags saved
                mealsSaved += order.quantity;
              }
            });
            
            setTotalSavings(savings);
            setTotalMealsSaved(mealsSaved);
            
            // Environmental impact calculations
            // 1 meal saved ≈ 1.5 kg CO2 equivalent (conservative estimate)
            // 1 meal ≈ 1,500 liters of water saved
            const co2 = mealsSaved * 1.5; // kg CO2
            const water = mealsSaved * 1500; // liters
            
            setCo2Saved(co2);
            setWaterSaved(water);
          });
        }
      } catch (err) {
        toast.error(t("client.profile.fetch_failed"));
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router, t]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const confirmedCount = orders.filter((o) => o.status === "confirmed").length;

  return (
    <main className="min-h-screen pt-24 pb-20 flex flex-col items-center bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] px-4 sm:px-6 lg:px-16">
        <ToastContainer
          position="top-right"
          autoClose={1000}
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

      {/* Minimal Profile Section */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        {pendingCount > 0 && (
          <div className="mb-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-xs text-center">
            {pendingCount} {pendingCount === 1 ? t("client.profile.pending_order") : t("client.profile.pending_orders")}
          </div>
        )}
        
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
              <Image src={profileImage} alt="Profile" width={56} height={56} priority className="object-cover w-full h-full" />
            </div>
            
            {isEditing ? (
              <div className="flex-1 flex flex-col gap-2">
                <input
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder={t("client.profile.username")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800 text-sm"
                />
                <input
                  name="phoneNumber"
                  type="number"
                  value={formData.phoneNumber ?? ""}
                  onChange={handleInputChange}
                  placeholder={t("client.profile.phone_number")}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-emerald-700 text-sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? t("common.saving") : t("common.save")}
                  </Button>
                  <Button
                    className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg hover:bg-gray-200 text-sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ username, phoneNumber });
                    }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">{username || t("client.profile.username")}</h1>
                  {phoneNumber && (
                    <p className="text-xs text-gray-500 mt-0.5">{phoneNumber}</p>
                  )}
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-200 text-xs"
                >
                  {t("common.edit")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full max-w-6xl mx-auto px-4 space-y-6">
        {/* Financial & Order Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Savings Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <div>
                <p className="text-sm text-emerald-700 font-medium">{t("client.profile.total_saved")}</p>
                <p className="text-2xl font-bold text-emerald-800">
                  {loading ? "..." : totalSavings.toFixed(2)} dt
                </p>
              </div>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              {t("client.profile.money_saved")}
            </p>
          </div>

          {/* Total Orders Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">{t("client.profile.total_orders")}</p>
                <p className="text-2xl font-bold text-blue-800">
                  {loading ? "..." : orders.length}
                </p>
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {t("client.profile.confirmed_pending", { confirmed: confirmedCount, pending: pendingCount })}
            </p>
          </div>

          {/* View Orders Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div>
                <p className="text-sm text-amber-700 font-medium">{t("client.profile.my_orders")}</p>
                <Button
                  onClick={() => router.push("/client/orders")}
                  className="mt-2 bg-amber-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-amber-700 text-sm"
                >
                  {t("client.profile.view_all")}
                </Button>
              </div>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              {t("client.profile.manage_orders")}
            </p>
          </div>
        </div>

        {/* Environmental Impact Section */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-teal-900">{t("client.profile.environmental_impact")}</h2>
                <p className="text-sm text-teal-700">{t("client.profile.contribution")}</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/impact")}
              className="bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-teal-700 text-sm"
            >
              {t("client.profile.learn_more")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Meals Saved */}
            <div className="bg-white rounded-xl p-5 border border-teal-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("client.profile.meals_saved")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : totalMealsSaved}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {t("client.profile.food_rescued")}
              </p>
            </div>

            {/* CO2 Saved */}
            <div className="bg-white rounded-xl p-5 border border-teal-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <span className="text-xl">🌍</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("client.profile.co2_saved")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : co2Saved.toFixed(1)} kg
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {t("client.profile.equivalent_trees", { trees: loading ? "..." : (co2Saved / 21).toFixed(1) })}
              </p>
            </div>

            {/* Water Saved */}
            <div className="bg-white rounded-xl p-5 border border-teal-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <span className="text-xl">💧</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("client.profile.water_saved")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : waterSaved >= 1000 ? `${(waterSaved / 1000).toFixed(1)}k` : waterSaved.toFixed(0)} L
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {t("client.profile.water_footprint")}
              </p>
            </div>
          </div>

          {/* Impact Message */}
          {!loading && totalMealsSaved > 0 && (
            <div className="mt-6 p-4 bg-teal-100 rounded-xl border border-teal-300">
              <p className="text-sm text-teal-900 font-medium text-center">
                {t("client.profile.impact_message", { 
                  meals: totalMealsSaved, 
                  plural: totalMealsSaved !== 1 ? "s" : "",
                  co2: co2Saved.toFixed(1),
                  water: waterSaved >= 1000 ? `${(waterSaved / 1000).toFixed(1)}k` : waterSaved.toFixed(0)
                })}
              </p>
            </div>
          )}
        </div>
      </div>

    </main>
  );
};

export default ProfilePage;