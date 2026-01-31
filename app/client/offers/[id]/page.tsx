"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { axiosInstance } from "@/lib/axiosInstance";
import { getBackendOrigin } from "@/lib/backendOrigin";
import { resolveImageSource, getImageFallbacks, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { formatDateTimeRange } from "@/components/offerCard/utils";
import { MapPin, Clock, Phone, Calendar, ShoppingBag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";

interface Offer {
  id: number;
  ownerId?: number;
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
  };
  images?: { filename: string; alt?: string; url?: string }[];
  title: string;
  description: string;
  price?: number;
  originalPrice?: number;
  expirationDate: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupLocation: string;
  mapsLink?: string;
  quantity: number;
  foodType?: "snack" | "meal" | "beverage" | "other";
  taste?: "sweet" | "salty" | "both" | "neutral";
}

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

const Offers = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useParams();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [inCart, setInCart] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_BAG_IMAGE);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([DEFAULT_BAG_IMAGE]);

  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      // Parse userId from token
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        setUserId(tokenPayload?.id);
      } catch (error) {
        console.error("Error parsing token:", error);
        router.push("/signIn");
        return;
      }

      try {
        const res = await axiosInstance.get(`/offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000, // 8 second timeout for faster feedback
        });
        
        // Normalize image URLs - preserve URLs from different backends
        const backendOrigin = getBackendOrigin();
        if (res.data.images && Array.isArray(res.data.images)) {
          res.data.images = res.data.images.map((img: any) => {
            if (!img) return img;
            if (typeof img.absoluteUrl === "string") {
              if (/^https?:\/\//i.test(img.absoluteUrl)) {
                try {
                  const urlObj = new URL(img.absoluteUrl);
                  const urlHost = urlObj.hostname;
                  
                  let currentBackendHost = "";
                  if (backendOrigin) {
                    try {
                      const backendUrlObj = new URL(backendOrigin);
                      currentBackendHost = backendUrlObj.hostname;
                    } catch {
                      const match = backendOrigin.match(/https?:\/\/([^\/]+)/);
                      if (match) currentBackendHost = match[1];
                    }
                  }
                  
                  // If from different backend, keep original URL
                  if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
                    return img;
                  }
                  
                  // Same backend - normalize (support both /store/ and /storage/)
                  const match = img.absoluteUrl.match(/\/(store\/.+)$/) || img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    const path = match[1].replace(/^storage\//, 'store/');
                    return { ...img, absoluteUrl: `${backendOrigin}/${path}` };
                  }
                } catch {
                  const match = img.absoluteUrl.match(/\/(store\/.+)$/) || img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    const path = match[1].replace(/^storage\//, 'store/');
                    return { ...img, absoluteUrl: `${backendOrigin}/${path}` };
                  }
                }
              } else if (img.absoluteUrl.startsWith("/store/") && backendOrigin) {
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
              } else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                // Legacy support: convert /storage/ to /store/
                const storePath = img.absoluteUrl.replace("/storage/", "/store/");
                return { ...img, absoluteUrl: `${backendOrigin}${storePath}` };
              }
            }
            return img;
          });
        }
        
        const firstImage = res.data.images?.[0];
        // Use unified image resolution
        const resolved = resolveImageSource(firstImage);
        const imageFallbacks = getImageFallbacks(firstImage);
        setFallbacks(imageFallbacks);
        setImageSrc(resolved);
        setFallbackIndex(0);
        setOffer(res.data);
      } catch (err) {
        console.error("Failed to fetch offer:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [id, router, t]);

  const handleOrder = async () => {
    if (!offer) {
      toast.error(t("client.offers.detail.offer_not_loaded") || "Offer not loaded. Please try again.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error(t("client.offers.detail.login_required") || "Please login to order.");
      router.push("/signIn");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/orders",
        {
          offerId: offer.id,
          quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        }
      );

      setInCart(true);
      toast.success(t("client.offers.detail.order_success") || "Order placed successfully!");
    } catch (err: any) {
      console.error("Order error:", err);
      toast.error(err?.response?.data?.message || t("client.offers.detail.order_error") || "Failed to place order.");
    }
  };

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("client.offers.detail.loading")}</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(offer.expirationDate).getTime() <= new Date().getTime();
  const { date: formattedDate, time: formattedTime } = formatDateTimeRange(offer.pickupStartTime, offer.pickupEndTime, offer.expirationDate);
  const isToday = formattedDate === "Today";
  // Prioritize offer's specific pickupLocation over owner's general location (matches backend logic)
  const currentLocation = (offer.pickupLocation && offer.pickupLocation.trim() !== '') ? offer.pickupLocation : (offer.owner?.location || offer.pickupLocation);
  const currentMapsLink = (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink);

  return (
    <>
      {loading ? (
        <LoadingSkeleton type="detail" />
      ) : (
        <>
          {/* Toast Container for notifications */}
          <ToastContainer
            position="top-center"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            limit={3}
            toastClassName="bg-white rounded-xl shadow-lg border border-gray-200"
            bodyClassName="text-sm font-medium text-gray-800"
            progressClassName="bg-emerald-500"
          />
          
          {/* Hero Section with Offer Image */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-emerald-100 to-teal-100">
            {offer?.images?.[0] ? (
              <Image
                src={imageSrc}
                alt={offer.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                priority
                onError={() => {
                  if (fallbackIndex < fallbacks.length - 1) {
                    setFallbackIndex(fallbackIndex + 1);
                    setImageSrc(fallbacks[fallbackIndex + 1]);
                  } else {
                    setImageSrc(DEFAULT_BAG_IMAGE);
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No image available</p>
                </div>
              </div>
            )}
            
            {offer.price && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-3 py-2 sm:px-4 sm:py-3 rounded-2xl shadow-2xl z-10">
                <div className="flex flex-col items-end">
                  <span className="text-lg sm:text-2xl font-extrabold">{offer.price} dt</span>
                  {offer.originalPrice && offer.originalPrice > offer.price && (
                    <>
                      <span className="text-xs sm:text-sm line-through opacity-90 mt-0.5">
                        {offer.originalPrice.toFixed(2)} dt
                      </span>
                      <span className="text-xs font-bold bg-yellow-400 text-gray-900 px-1.5 py-0.5 rounded-full mt-0.5">
                        -{((1 - offer.price / offer.originalPrice) * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Type and Taste Badges - Bottom Left (Horizontal, like home page) */}
            {(offer.foodType || offer.taste) && (
              <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5 z-10">
                {/* Type Badge */}
                {offer.foodType && (
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-800 shadow-md">
                    {offer.foodType === "snack" && "🍪"}
                    {offer.foodType === "meal" && "🍽️"}
                    {offer.foodType === "beverage" && "🥤"}
                    {offer.foodType === "other" && "📦"}
                    <span className="ml-1">{t(`offers.food_type_${offer.foodType}`) || offer.foodType}</span>
                  </span>
                )}
                
                {/* Taste Badge */}
                {offer.taste && (
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-pink-100 text-pink-800 shadow-md">
                    {offer.taste === "sweet" && "🍯"}
                    {offer.taste === "salty" && "🧂"}
                    {offer.taste === "both" && "🍬"}
                    {offer.taste === "neutral" && "⚪"}
                    <span className="ml-1">{t(`offers.taste_${offer.taste}`) || offer.taste}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              {/* Offer Title and Description */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{offer.title}</h1>
                <p className="text-gray-600 leading-relaxed">{offer.description}</p>
              </div>

              {/* Provider Info */}
              {offer.owner && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t("client.offers.detail.provider_info")}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-lg font-bold">
                        {offer.owner.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{offer.owner.username}</h3>
                      {offer.owner.phoneNumber && (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-600 mt-1">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{offer.owner.phoneNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Pickup Information */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {t("client.offers.detail.pickup_location")}
                    </p>
                    <p className="text-sm font-bold text-gray-900 truncate">{currentLocation}</p>
                    {currentMapsLink && (
                      <a
                        href={currentMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-2"
                      >
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                        {t("client.offers.detail.view_maps")}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 sm:p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {t("client.offers.detail.pickup_time")}
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      {isToday ? t("client.offers.detail.today") : formattedDate}
                    </p>
                    <p className="text-sm text-gray-600">{formattedTime}</p>
                  </div>
                </div>
              </div>

              {/* Quantity and Order Section */}
              <div className="mt-6 border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-700">
                      {t("client.offers.detail.quantity")}:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center text-base sm:text-lg disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <span className="w-10 sm:w-12 text-center text-base sm:text-lg font-bold text-gray-900">{quantity}</span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(q + 1, offer.quantity))}
                        disabled={quantity >= offer.quantity}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center text-base sm:text-lg disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    onClick={handleOrder}
                    disabled={inCart || isExpired || offer.quantity === 0}
                    className={`w-full sm:w-auto px-6 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg shadow-lg transition-all ${
                      inCart
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : isExpired || offer.quantity === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {inCart
                      ? `✓ ${t("common.added_to_cart")}`
                      : isExpired
                      ? t("common.expired")
                      : offer.quantity === 0
                      ? t("common.out_of_stock")
                      : `${t("common.order_now")} • ${offer.price ? `${(offer.price * quantity).toFixed(2)} dt` : t("common.free")}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Offers;
