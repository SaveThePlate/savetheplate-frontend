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
    axiosInstance
      .get(`/auth/get-user-by-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUserId(res.data.id))
      .catch(() => router.push("/signIn"));
  }, [router]);

  const handleOrder = async () => {
    if (!offer) return;
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }
    if (new Date(offer.expirationDate).getTime() <= new Date().getTime()) {
      return;
    }
    try {
      await axiosInstance.post(
        `/orders`,
        { userId, offerId: offer.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInCart(true);
    } catch (err: any) {
      console.error("Error placing order:", err);
    }
  };

  const isExpired = offer ? new Date(offer.expirationDate).getTime() <= new Date().getTime() : false;
  const { date: formattedDate, time: formattedTime } = offer 
    ? formatDateTimeRange(offer.pickupStartTime, offer.pickupEndTime, offer.expirationDate)
    : { date: "", time: "" };
  const isToday = formattedDate === "Today";
  // Prioritize offer's specific pickupLocation over owner's general location (matches backend logic)
  const currentLocation = (offer?.pickupLocation && offer.pickupLocation.trim() !== '') ? offer.pickupLocation : (offer?.owner?.location || offer?.pickupLocation);
  const currentMapsLink = (offer?.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer?.owner?.mapsLink || offer?.mapsLink);

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

  return (
    <div className="w-full h-[calc(100vh-5rem)] sm:h-[calc(100vh-6rem)] flex items-center justify-center px-3 sm:px-4 lg:px-6 overflow-hidden">
      <div className="w-full max-w-2xl lg:max-w-4xl flex items-center justify-center h-full">

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-border w-full h-auto max-h-[90%] flex flex-col">
          {/* Hero Image - Compact */}
          <div className="relative w-full h-48 sm:h-56 flex-shrink-0 bg-muted">
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
            
            {/* Badges Overlay - Top Left */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
              {isExpired && (
                <div className="bg-gray-800 text-white px-2 py-1 rounded-full text-[10px] font-semibold shadow-md">
                  {t("common.expired")}
                </div>
              )}
            </div>

            {/* Price Badge - Top Right */}
            {offer.price && (
              <div className="absolute top-2 right-2 bg-emerald-600 text-white font-semibold px-3 py-1.5 rounded-xl text-xs shadow-lg z-10">
                <div className="flex flex-col items-end leading-tight">
                  <span className="font-bold text-base">{offer.price} dt</span>
                  {offer.originalPrice && offer.originalPrice > offer.price && (
                    <>
                      <span className="text-[10px] font-normal line-through opacity-75">
                        {offer.originalPrice.toFixed(2)} dt
                      </span>
                      <span className="text-[10px] font-bold mt-0.5 bg-emerald-50/80 px-1.5 py-0.5 rounded">
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

          {/* Content - Compact, no scroll */}
          <div className="p-2 sm:p-3 space-y-2 flex-1 min-h-0 overflow-hidden flex flex-col">
            {/* Title */}
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-foreground mb-0.5 line-clamp-1">{offer.title}</h1>
              <p className="text-xs text-muted-foreground leading-tight line-clamp-1">{offer.description}</p>
            </div>

            {/* Provider Information - Compact */}
            {offer.owner && (
              <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-lg border border-border flex-shrink-0">
                <div className="w-7 h-7 rounded-full border border-white overflow-hidden bg-white flex-shrink-0 shadow-sm">
                  <Image
                    src={sanitizeImageUrl(offer.owner.profileImage ? resolveImageSource(offer.owner.profileImage) : "/logo.png")}
                    alt={offer.owner.username}
                    width={28}
                    height={28}
                    className="object-cover w-full h-full"
                    unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(offer.owner.profileImage ? resolveImageSource(offer.owner.profileImage) : "/logo.png"))}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo.png";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-foreground truncate">{offer.owner.username}</h3>
                  {offer.owner.phoneNumber && (
                    <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Phone className="w-2.5 h-2.5" />
                      <span>{offer.owner.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Information - Compact Grid */}
            <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
              <div className="flex items-start gap-1.5 p-1.5 bg-gray-50 rounded-lg border border-border">
                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                    {t("client.offers.detail.pickup_location")}
                  </p>
                  <p className="text-[10px] font-semibold text-foreground line-clamp-1">{currentLocation}</p>
                  {currentMapsLink && (
                    <a
                      href={currentMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-0.5"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      {t("common.open_in_maps")}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-1.5 p-1.5 bg-gray-50 rounded-lg border border-border">
                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="w-3 h-3 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                    {t("client.offers.detail.pickup_deadline")}
                  </p>
                  <p className="text-[10px] font-semibold text-foreground">
                    {isToday ? t("common.today") : formattedDate}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                    {formattedTime ? (formattedTime.includes(" - ") ? `${t("common.between")} ${formattedTime}` : `${t("common.at")} ${formattedTime}`) : ""}
                  </p>
                  {isExpired && (
                    <span className="inline-block mt-0.5 px-1 py-0.5 bg-red-100 text-red-700 text-[9px] font-semibold rounded-full">
                      {t("common.expired")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity Selector and Order Button - Compact */}
            <div className="space-y-1.5 flex-shrink-0 mt-auto">
              <div className="p-1.5 bg-gray-50 rounded-lg border border-border">
                <p className="text-[10px] font-semibold text-foreground mb-1 text-center">{t("client.offers.detail.quantity")}</p>
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                    className="w-7 h-7 flex items-center justify-center bg-white border-2 border-border rounded-lg hover:bg-gray-50 hover:border-primary font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span className="text-base font-bold text-foreground min-w-[1.5rem] text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(q + 1, offer.quantity))}
                    className="w-7 h-7 flex items-center justify-center bg-white border-2 border-border rounded-lg hover:bg-gray-50 hover:border-primary font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity >= offer.quantity}
                  >
                    +
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground text-center mt-0.5">
                  {offer.quantity} {t("client.offers.detail.available")}
                </p>
              </div>

              {/* Order Button */}
              <button
                onClick={handleOrder}
                disabled={offer.quantity === 0 || isExpired}
                className={`w-full py-2 rounded-lg font-bold text-xs transition-all shadow-md ${
                  offer.quantity === 0 || isExpired
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : inCart
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {offer.quantity === 0
                  ? t("common.out_of_stock")
                  : isExpired
                  ? t("common.expired")
                  : inCart
                  ? t("common.added_to_cart")
                  : t("client.offers.detail.order_button", { price: offer.price ? `${(offer.price * quantity).toFixed(2)}` : t("common.free") })}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;