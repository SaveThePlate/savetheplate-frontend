"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { resolveImageSource, getImageFallbacks, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { formatDateTimeRange } from "@/components/offerCard/utils";
import { ArrowLeft, MapPin, Clock, Phone, Calendar, ShoppingBag } from "lucide-react";
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
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Normalize image URLs - preserve URLs from different backends
        const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
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
                  
                  // Same backend - normalize
                  const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
                  }
                } catch {
                  const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
                  }
                }
              } else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
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
      } catch {
        toast.error(t("client.offers.detail.failed"));
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
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/get-user-by-token`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setUserId(res.data.id))
      .catch(() => router.push("/signIn"));
  }, [router]);

  const handleOrder = async () => {
    if (!offer) return;
    const token = localStorage.getItem("accessToken");
    if (!token) return toast.error(t("client.offers.detail.login_required"));
    if (new Date(offer.expirationDate).getTime() <= new Date().getTime()) {
      return toast.error(t("client.offers.detail.expired_cannot_order"));
    }
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders`,
        { userId, offerId: offer.id, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInCart(true);
      toast.success(t("client.offers.detail.order_success"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("client.offers.detail.order_failed"));
    }
  };

  const isRescuePack = offer?.title.toLowerCase().includes("rescue pack") || false;
  const isExpired = offer ? new Date(offer.expirationDate).getTime() <= new Date().getTime() : false;
  const { date: formattedDate, time: formattedTime } = offer 
    ? formatDateTimeRange(offer.pickupStartTime, offer.pickupEndTime, offer.expirationDate)
    : { date: "", time: "" };
  const isToday = formattedDate === "Today";
  const currentMapsLink = offer?.owner?.mapsLink || offer?.mapsLink;
  const currentLocation = offer?.owner?.location || offer?.pickupLocation;

  if (!offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t("client.offers.detail.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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

      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">{t("client.offers.detail.title")}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-200">
          {/* Hero Image */}
          <div className="relative w-full h-80 sm:h-96 bg-gray-100">
            <Image
              src={sanitizeImageUrl(imageSrc)}
              alt={offer.title}
              fill
              sizes="100vw"
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
            
            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {isExpired && (
                <div className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                  {t("common.expired")}
                </div>
              )}
              {offer.quantity > 0 && !isExpired && (
                <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md">
                  {offer.quantity} {t("common.left")}
                </div>
              )}
            </div>

            {/* Price Badge - Top Right */}
            {offer.price && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-2xl text-sm shadow-lg z-10">
                <div className="flex flex-col items-end leading-tight">
                  <span className="font-bold text-lg">{offer.price} dt</span>
                  {offer.originalPrice && offer.originalPrice > offer.price && (
                    <>
                      <span className="text-xs font-normal line-through opacity-75">
                        {offer.originalPrice.toFixed(2)} dt
                      </span>
                      <span className="text-xs font-bold mt-1 bg-white/20 px-2 py-0.5 rounded">
                        -{((1 - offer.price / offer.originalPrice) * 100).toFixed(0)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Title and Type */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                  {isRescuePack ? t("offers.rescue_pack") : t("offers.custom_offer")}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{offer.title}</h1>
              <p className="text-gray-700 leading-relaxed">{offer.description}</p>
            </div>

            {/* Provider Information */}
            {offer.owner && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="w-14 h-14 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0 shadow-md">
                  <Image
                    src={offer.owner.profileImage ? resolveImageSource(offer.owner.profileImage) : "/logo.png"}
                    alt={offer.owner.username}
                    width={56}
                    height={56}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo.png";
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 truncate">{offer.owner.username}</h3>
                  {offer.owner.phoneNumber && (
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{offer.owner.phoneNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pickup Information */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("client.offers.detail.pickup_location")}
                  </p>
                  <p className="text-base font-semibold text-gray-900 mb-1">{currentLocation}</p>
                  {currentMapsLink && (
                    <a
                      href={currentMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      {t("common.open_in_maps")}
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("client.offers.detail.pickup_deadline")}
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    {isToday ? t("common.today") : formattedDate}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {formattedTime ? (formattedTime.includes(" - ") ? `${t("common.between")} ${formattedTime}` : `${t("common.at")} ${formattedTime}`) : ""}
                  </p>
                  {isExpired && (
                    <span className="inline-block mt-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      {t("common.expired")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">{t("client.offers.detail.quantity")}</p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setQuantity((q) => Math.max(q - 1, 1))}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-emerald-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="text-2xl font-bold text-gray-900 min-w-[3rem] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(q + 1, offer.quantity))}
                  className="w-10 h-10 flex items-center justify-center bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-emerald-500 font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantity >= offer.quantity}
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                {offer.quantity} {t("client.offers.detail.available")}
              </p>
            </div>

            {/* Order Button */}
            <button
              onClick={handleOrder}
              disabled={offer.quantity === 0 || isExpired}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
                offer.quantity === 0 || isExpired
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
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
  );
};

export default Offers;