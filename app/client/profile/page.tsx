"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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

const DEFAULT_BAG_IMAGE = "/defaultBag.png";
const getImage = (filename?: string | null): string => {
  if (!filename) return DEFAULT_BAG_IMAGE;

  // full URL from API
  if (/^https?:\/\//i.test(filename)) return filename;

  // path starting with /storage/ should be served from backend storage
  if (filename.startsWith("/storage/")) {
    const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
    return origin + filename;
  }

  // leading slash -> public asset in frontend's /public
  if (filename.startsWith("/")) return filename;

  // bare filename, fallback to public folder
  return `/${filename}`;
};

const ProfilePage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<number | null>(null);
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [orders, setOrders] = useState<Order[]>([]);
  const [offersDetails, setOffersDetails] = useState<Record<number, Offer>>({});
  const [loading, setLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_BAG_IMAGE);
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
      toast.success("Profile updated successfully");
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("Failed to update profile");
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

        // Fetch all offers in parallel (non-blocking - can load after orders are shown)
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

            // Set image from first order's offer if available
            if (ordersData.length > 0 && offersMap[ordersData[0].offerId]) {
              const firstOffer = offersMap[ordersData[0].offerId];
              const firstImage = firstOffer.images?.[0];
              const image = firstImage?.filename ? getImage(firstImage.filename) : DEFAULT_BAG_IMAGE;
              setImageSrc(image);
            }
          });
        }
      } catch (err) {
        toast.error("Failed to fetch profile or orders");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const priority: Record<string, number> = { pending: 0, confirmed: 1, cancelled: 2 };
  const sortedOrders = [...orders].sort((a, b) => {
    const pa = priority[a.status] ?? 99;
    const pb = priority[b.status] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

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

      <div className="w-full max-w-md bg-white rounded-3xl p-8 mb-10 flex flex-col items-center text-center border border-gray-100">
        {pendingCount > 0 && (
          <div className="w-full mb-4 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
            You have {pendingCount} pending order{pendingCount > 1 ? "s" : ""}. Check <strong>My Purchases</strong> to confirm.
          </div>
        )}

        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#CFE8D5] mb-4">
          <Image src={profileImage} alt="Profile" width={128} height={128} priority className="object-cover w-full h-full" />
        </div>

        {isEditing ? (
          <div className="w-full flex flex-col gap-3">
            <input
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Username"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800"
            />
            <input
              name="phoneNumber"
              type="number"
              value={formData.phoneNumber ?? ""}
              onChange={handleInputChange}
              placeholder="Phone number"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:outline-none text-gray-800"
            />
            <div className="flex gap-3 justify-center mt-2 flex-wrap">
              <Button
                className="bg-[#FFAE8A] text-white px-4 py-2 rounded-xl font-semibold hover:bg-[#ff9966]"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ username, phoneNumber });
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-800">{username || "Username"}</h1>
            <p className="text-gray-600 mt-1">{phoneNumber ?? "Phone number"}</p>
            <div className="mt-4">
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-[#FFAE8A] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#ff9966]"
              >
                Edit Profile
              </Button>
            </div>
          </>
        )}
      </div>

{/* Orders Section */}
<section className="w-full max-w-6xl mx-auto px-4 space-y-10">
  <h2 className="text-3xl font-bold text-gray-900 text-center">My Past Orders</h2>

  {loading ? (
    <p className="text-gray-600 text-center">Loading orders...</p>
  ) : orders.length === 0 ? (
    <div className="text-center text-gray-600">
      <p className="text-lg mb-4">You haven’t placed any orders yet.</p>
      <Button
        className="bg-[#FFAE8A] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#ff9966] transition"
        onClick={() => router.push("./home")}
      >
        Explore Offers
      </Button>
    </div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {sortedOrders.map((order) => {
        const offer = offersDetails[order.offerId];
        return (
          <div
            key={order.id}
            className="group bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col"
          >
            {/* 🖼️ Image Header */}
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={imageSrc}
                alt={offer?.title || "Order Image"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute bottom-3 left-3">
                <h3 className="text-white text-lg font-semibold drop-shadow-sm">
                  {offer?.title || "Offer"}
                </h3>
              </div>
            </div>

            {/* 🧾 Card Content */}
            <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
              <div className="space-y-3">
                {/* Unified Pickup Button */}
                {(offer?.owner?.location || offer?.pickupLocation) && (
                  <a
                    href={offer?.owner?.mapsLink || offer?.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full bg-[#FFAE8A]/10 hover:bg-[#FFAE8A]/20 text-[#FF7F50] font-semibold text-sm py-2 px-3 rounded-full transition-all"
                  >
                    📍 Pickup:{" "}
                    <span className="ml-1 text-gray-800 truncate font-medium">
                      {offer.owner?.location || offer.pickupLocation}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 ml-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </a>
                )}

                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">🗓️</span>
                  <span>
                    Ordered on{" "}
                    <span className="font-medium text-gray-700">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </span>
                </div>
              </div>

              {/* 🏷️ Status + Quantity */}
              <div className="flex items-center justify-between pt-2">
                <span
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full ${
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>

                <span className="bg-emerald-50 text-emerald-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                  {order.quantity} {order.quantity > 1 ? "items" : "item"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}
</section>

    </main>
  );
};

export default ProfilePage;
