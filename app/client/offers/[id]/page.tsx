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
  const [quantity, setQuantity] = useState(1);
  const [inCart, setInCart] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_BAG_IMAGE);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([DEFAULT_BAG_IMAGE]);

  useEffect(() => {
    const fetchOffer = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/signIn");
      try {
        const res = await axiosInstance.get(`/offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
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
      }
    };
    fetchOffer();
  }, [id, router, t]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
        router.push("/signIn");
        return;
      }
    // Parse userId from token instead of making API call
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      setUserId(tokenPayload?.id);
    } catch (error) {
      console.error("Error parsing token:", error);
      router.push("/signIn");
    }
  }, [router]);

  const handleOrder = async () => {
    if (!offer) {
      toast.error(t("client.offers.detail.offer_not_loaded") || "Offer not loaded. Please try again.");
      return;
    }
    
    // Validate offer ID and quantity before making the request
    if (!offer.id || typeof offer.id !== 'number') {
      console.error("Invalid offer ID:", offer.id);
      toast.error(t("client.offers.detail.invalid_offer") || "Invalid offer. Please refresh the page.");
      return;
    }
    
    if (!quantity || quantity <= 0) {
      toast.error(t("client.offers.detail.invalid_quantity") || "Please select a valid quantity.");
      return;
    }
    
    if (quantity > offer.quantity) {
      toast.error(t("client.offers.detail.insufficient_stock") || `Only ${offer.quantity} items available.`);
      return;
    }
    
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }
    
    if (new Date(offer.expirationDate).getTime() <= new Date().getTime()) {
      toast.error(t("client.offers.detail.offer_expired") || "This offer has expired");
      return;
    }
    
    try {
      // Don't send userId in body - backend gets it from auth token
      // Ensure both offerId and quantity are numbers
      const orderData = {
        offerId: Number(offer.id),
        quantity: Number(quantity)
      };
      
      console.log("Placing order with data:", orderData); // Debug log
      
      await axiosInstance.post(
        `/orders`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInCart(true);
      
      // Show success toast notification
      toast.success(
        t("client.offers.detail.order_success") || 
        `🎉 Order placed successfully! ${quantity} ${quantity > 1 ? 'items' : 'item'} added to your orders.`,
        {
          position: "top-center",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
      
      // Optional: Redirect to orders page after a short delay
      setTimeout(() => {
        router.push(userId ? `/client/orders/${userId}` : "/client/orders");
      }, 2000);
      
    } catch (err: any) {
      console.error("Error placing order:", err);
      console.error("Order data that failed:", { offerId: offer.id, quantity }); // Debug log
      
      // Show error toast notification
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          t("client.offers.detail.order_error") || 
                          "Failed to place order. Please try again.";
      
      toast.error(errorMessage, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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
      
      {/* Main Container - Clean and Direct */}
      <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 to-gray-100 pb-24 pt-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200">
          {/* Hero Image */}
          <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-emerald-100 to-teal-100">
            <Image
              src={sanitizeImageUrl(imageSrc)}
              alt={offer.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 896px, 1152px"
              priority
              className="object-cover"
              unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(imageSrc))}
              onError={() => {
                const nextIndex = fallbackIndex + 1;
                if (nextIndex < fallbacks.length) {
                  setFallbackIndex(nextIndex);
                  setImageSrc(fallbacks[nextIndex]);
                } else {
                  setImageSrc(DEFAULT_BAG_IMAGE);
                }
              }}
            />
            
            {/* Status Badge - Top Left */}
            {isExpired && (
              <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                {t("common.expired")}
              </div>
            )}
            {!isExpired && offer.quantity <= 3 && (
              <div className="absolute top-4 left-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">
                {offer.quantity} {t("common.left")}!
              </div>
            )}

            {/* Price Badge - Top Right */}
            {offer.price && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-5 py-3 rounded-2xl shadow-2xl">
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-extrabold">{offer.price} dt</span>
                  {offer.originalPrice && offer.originalPrice > offer.price && (
                    <>
                      <span className="text-sm line-through opacity-90 mt-1">
                        {offer.originalPrice.toFixed(2)} dt
                      </span>
                      <span className="text-xs font-bold bg-yellow-400 text-gray-900 px-2 py-0.5 rounded-full mt-1">
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
                  <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-800 shadow-md">
                    {offer.taste === "sweet" && "🍰"}
                    {offer.taste === "salty" && "🧂"}
                    {offer.taste === "both" && "🍬"}
                    {offer.taste === "neutral" && "⚪"}
                    <span className="ml-1">{t(`offers.taste_${offer.taste}`) || offer.taste}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title & Description */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{offer.title}</h1>
              <p className="text-base text-gray-600 leading-relaxed">{offer.description}</p>
            </div>

            {/* Provider Information */}
            {offer.owner && (
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border-2 border-emerald-200">
                <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0 shadow-md">
                  <Image
                    src={sanitizeImageUrl(offer.owner.profileImage ? resolveImageSource(offer.owner.profileImage) : "/logo.png")}
                    alt={offer.owner.username}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                    unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(offer.owner.profileImage ? resolveImageSource(offer.owner.profileImage) : "/logo.png"))}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo.png";
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900">{offer.owner.username}</h3>
                  {offer.owner.phoneNumber && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{offer.owner.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-emerald-300 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("client.offers.detail.pickup_location")}
                  </p>
                  <p className="text-sm font-bold text-gray-900">{currentLocation}</p>
                  {currentMapsLink && (
                    <a
                      href={currentMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-2"
                    >
                      <MapPin className="w-4 h-4" />
                      {t("common.open_in_maps")}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-amber-300 transition-colors">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("client.offers.detail.pickup_deadline")}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {isToday ? t("common.today") : formattedDate}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formattedTime ? (formattedTime.includes(" - ") ? `${t("common.between")} ${formattedTime}` : `${t("common.at")} ${formattedTime}`) : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Selector and Order Button */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">{t("client.offers.detail.quantity")}</span>
                    <span className="text-xs text-gray-500">{offer.quantity} {t("client.offers.detail.available")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-xl px-4 py-2 border-2 border-gray-200 shadow-sm">
                  <button
                    onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center text-lg"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-lg font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(q + 1, offer.quantity))}
                    disabled={quantity >= offer.quantity}
                    className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold transition-all hover:scale-105 active:scale-95 flex items-center justify-center text-lg disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Order Button */}
              <button
                onClick={handleOrder}
                disabled={inCart || isExpired || offer.quantity === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all ${
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
      </div>
    </>
  );
};

export default Offers;