"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OrderQRCode from "./OrderQRCode";
import { resolveImageSource, getImageFallbacks, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { formatDateTimeRange } from "@/components/offerCard/utils";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { 
  MapPin, 
  Calendar, 
  Package, 
  QrCode, 
  X, 
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Star
} from "lucide-react";
import RatingDialog from "./RatingDialog";

interface CartOrderProps {
  order: {
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
  onOrderCancelled?: (orderId: number) => void;
}

type Offer = {
  id: number;
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
  };
  images?: { path?: string; url?: string; alt?: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupLocation: string;
  quantity: number;
  mapsLink?: string;
};

const DEFAULT_IMAGE = "/defaultBag.png";

const CartOrder: React.FC<CartOrderProps> = ({ order, onOrderCancelled }) => {
  const router = useRouter();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([DEFAULT_IMAGE]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showDetails, setShowDetails] = useState(false); // For confirmed/cancelled orders
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  // Local state for instant UI updates
  const [localOrderStatus, setLocalOrderStatus] = useState<string>(order.status);
  const { t } = useLanguage();

  // Sync local status with prop when prop changes
  useEffect(() => {
    setLocalOrderStatus(order.status);
  }, [order.status]);

  // Check if order has been rated
  useEffect(() => {
    const checkRating = async () => {
      if (localOrderStatus !== "confirmed" || !order.collectedAt) return;
      
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const ratingRes = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/ratings/order/${order.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (ratingRes.data) {
          setHasRated(true);
        }
      } catch (err: any) {
        // Rating doesn't exist yet or endpoint doesn't exist - that's okay
        if (err?.response?.status !== 404) {
          console.error("Failed to check rating:", err);
        }
      }
    };

    checkRating();
  }, [order.id, localOrderStatus, order.collectedAt]);

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/signIn");

      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${order.offerId}`, {
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
        
        setOffer(res.data);

        const firstImage = res.data.images?.[0];
        // Use unified image resolution
        const resolved = resolveImageSource(firstImage);
        const imageFallbacks = getImageFallbacks(firstImage);
        setFallbacks(imageFallbacks);
        setImageSrc(resolved);
        setFallbackIndex(0);
      } catch (err) {
        console.error("Failed to fetch offer:", err);
        setError(t("cart_order.load_offer_failed"));
        // keep current imageSrc if set
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [order.offerId, router, t]);

  const isExpired = offer && new Date(offer.expirationDate).getTime() <= Date.now();
  
  // Use local status for instant UI updates
  const currentStatus = localOrderStatus;
  
  // For pending orders, always show details. For others, use state
  const isPending = currentStatus === "pending";
  const shouldShowDetails = isPending || showDetails;

  const getStatusConfig = () => {
    switch (currentStatus) {
      case "pending":
        return {
          bg: "bg-yellow-50",
          border: "border-yellow-300",
          text: "text-yellow-800",
          badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
          icon: Clock,
        };
      case "confirmed":
        return {
          bg: "bg-emerald-50",
          border: "border-emerald-300",
          text: "text-emerald-800",
          badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
          icon: CheckCircle2,
        };
      case "cancelled":
        return {
          bg: "bg-red-50",
          border: "border-red-300",
          text: "text-red-800",
          badge: "bg-red-100 text-red-800 border-red-300",
          icon: XCircle,
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-gray-300",
          text: "text-gray-800",
          badge: "bg-gray-100 text-gray-800 border-gray-300",
          icon: Package,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const handleCancelOrder = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");
    if (localOrderStatus !== "pending") return toast.error(t("cart_order.only_pending_cancellable"));
    setCanceling(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update order status locally for instant UI update
      setLocalOrderStatus("cancelled");
      if (onOrderCancelled) {
        onOrderCancelled(order.id);
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = sanitizeErrorMessage(err, {
        action: "cancel order",
        defaultMessage: t("cart_order.cancel_failed") || "Unable to cancel order. Please try again."
      });
      toast.error(errorMsg);
    } finally {
      setCanceling(false);
    }
  };


  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-md p-4 sm:p-6 border border-gray-200">
        <div className="animate-pulse flex gap-3 sm:gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg flex-shrink-0"></div>
          <div className="flex-1 space-y-3 min-w-0">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="w-full bg-red-50 rounded-2xl shadow-md p-4 sm:p-6 border border-red-200">
        <p className="text-sm sm:text-base text-red-600 text-center break-words px-2">{error || t("cart_order.load_details_failed")}</p>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const collectedDate = order.collectedAt ? new Date(order.collectedAt) : null;
  const { date: formattedDate, time: formattedTime } = formatDateTimeRange(
    offer.pickupStartTime,
    offer.pickupEndTime,
    offer.expirationDate
  );

  return (
    <div
      className={`w-full bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-2 ${
        isExpired ? `${statusConfig.border} opacity-75` : statusConfig.border
      }`}
    >
      <ToastContainer
        position="top-right"
        autoClose={1500}
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

      <div className="p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex gap-3 sm:gap-4 mb-4 sm:mb-6">
          {/* Image */}
          <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 relative rounded-lg overflow-hidden shadow-md border-2 border-gray-100">
            <Image
              src={sanitizeImageUrl(imageSrc)}
              alt={offer.title}
              fill
              sizes="(max-width: 640px) 64px, 80px"
              className="object-cover"
              priority
              unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(imageSrc))}
              onError={() => {
                const nextIndex = fallbackIndex + 1;
                if (nextIndex < fallbacks.length) {
                  setFallbackIndex(nextIndex);
                  setImageSrc(fallbacks[nextIndex]);
                } else {
                  setImageSrc(DEFAULT_IMAGE);
                }
              }}
            />
          </div>

          {/* Title and Status */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 break-words">
              {offer.title}
            </h3>
            <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border ${statusConfig.badge} mb-2 sm:mb-3`}>
              <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-[10px] xs:text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                {currentStatus}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3 break-words">
              {offer.description}
            </p>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-emerald-700">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{t("cart_order.quantity_label")} {order.quantity}</span>
            </div>
          </div>
        </div>

        {/* Information Grid - Collapsible for non-pending orders */}
        {shouldShowDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 animate-in slide-in-from-top-2 duration-300">
            {/* Pickup Location */}
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("cart_order.pickup_location")}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1 break-words">
                  {offer.owner?.location || offer.pickupLocation}
                </p>
                {(offer.owner?.mapsLink || offer.mapsLink) && (
                  <a
                    href={offer.owner?.mapsLink || offer.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] xs:text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors break-all"
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="break-words">{t("cart_order.open_in_maps")}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Expiration Date */}
            <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("cart_order.pickup_deadline")}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                  {formattedDate}
                </p>
                <p className="text-[10px] xs:text-xs text-gray-600 mt-0.5 break-words">
                  {formattedTime ? (formattedTime.includes(" - ") ? `${t("common.between")} ${formattedTime}` : `${t("common.at")} ${formattedTime}`) : ""}
                </p>
                {isExpired && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] xs:text-xs font-semibold rounded-full">
                    {t("common.expired")}
                  </span>
                )}
              </div>
            </div>

            {/* Order Date and Picked Up At - Side by side when both exist */}
            <div className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200 ${order.status === "confirmed" && collectedDate ? "" : "sm:col-span-2"}`}>
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {t("cart_order.ordered_on")}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  {orderDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[10px] xs:text-xs text-gray-600 mt-0.5">
                  {orderDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Picked Up At - Only show for confirmed orders with collectedAt */}
            {currentStatus === "confirmed" && collectedDate && (
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] xs:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    {t("cart_order.picked_up_at")}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">
                    {collectedDate.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-[10px] xs:text-xs text-gray-600 mt-0.5">
                    {collectedDate.toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Toggle Details Button - Only for non-pending orders */}
        {!isPending && (
          <div className="mb-3 sm:mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors text-sm sm:text-base"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="break-words">{t("cart_order.hide_details")}</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="break-words">{t("cart_order.show_details")}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Actions Section - Only show for pending orders or when details are expanded */}
        {shouldShowDetails && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-gray-200">
            {currentStatus === "pending" && order.qrCodeToken && (
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base min-w-0"
              >
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">{showQRCode ? t("cart_order.hide_qr") : t("cart_order.show_qr")}</span>
                {showQRCode ? (
                  <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                )}
              </button>
            )}
            {currentStatus === "pending" && (
              <button
                onClick={handleCancelOrder}
                disabled={canceling}
                className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all text-sm sm:text-base min-w-0 ${
                  canceling
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg"
                }`}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">{canceling ? t("cart_order.cancelling") : t("cart_order.cancel_order")}</span>
              </button>
            )}
          </div>
        )}

        {/* Rate Experience Section - Always visible for confirmed orders with pickup */}
        {currentStatus === "confirmed" && order.collectedAt && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            {!hasRated ? (
              <button
                onClick={() => setShowRatingDialog(true)}
                className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm sm:text-base"
              >
                <Star className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 fill-current" />
                <span>{t("cart_order.rate_experience") || "Rate Your Experience"}</span>
              </button>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-xl font-semibold text-sm sm:text-base">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 fill-current" />
                <span>{t("cart_order.rated") || "Thank you for your rating!"}</span>
              </div>
            )}
          </div>
        )}

        {/* QR Code Section (Collapsible) */}
        {currentStatus === "pending" && order.qrCodeToken && showQRCode && (
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <OrderQRCode
              qrCodeToken={order.qrCodeToken}
              orderId={order.id}
              orderTitle={offer.title}
            />
          </div>
        )}
      </div>

      {/* Rating Dialog */}
      {offer && offer.owner && (
        <RatingDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          orderId={order.id}
          providerId={offer.owner.id}
          providerName={offer.owner.username}
          onRatingSubmitted={() => {
            setHasRated(true);
            // Optionally refresh the page or update order data
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }}
        />
      )}
    </div>
  );
};

export default CartOrder;
