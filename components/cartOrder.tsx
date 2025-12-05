"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OrderQRCode from "./OrderQRCode";
import { resolveImageSource, getImageFallbacks } from "@/utils/imageUtils";
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
  ChevronUp
} from "lucide-react";

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
  };
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
  pickupLocation: string;
  quantity: number;
  mapsLink?: string;
};

const DEFAULT_IMAGE = "/defaultBag.png";

const CartOrder: React.FC<CartOrderProps> = ({ order }) => {
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

  useEffect(() => {
    const run = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/signIn");

      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${order.offerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
        setError("Failed to load offer data");
        // keep current imageSrc if set
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [order.offerId, router]);

  const isExpired = offer && new Date(offer.expirationDate).getTime() <= Date.now();
  
  // For pending orders, always show details. For others, use state
  const isPending = order.status === "pending";
  const shouldShowDetails = isPending || showDetails;

  const getStatusConfig = () => {
    switch (order.status) {
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
    if (order.status !== "pending") return toast.error("Only pending orders can be cancelled");
    setCanceling(true);
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/${order.id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Order cancelled");
      window.location.reload();
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order");
    } finally {
      setCanceling(false);
    }
  };


  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        <div className="animate-pulse flex gap-4">
          <div className="w-24 h-24 bg-gray-200 rounded-xl"></div>
          <div className="flex-1 space-y-3">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="w-full bg-red-50 rounded-2xl shadow-md p-6 border border-red-200">
        <p className="text-red-600 text-center">{error || "Failed to load order details"}</p>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const expirationDate = new Date(offer.expirationDate);

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

      <div className="p-6">
        {/* Header Section */}
        <div className="flex gap-4 mb-6">
          {/* Image */}
          <div className="flex-shrink-0 w-28 h-28 sm:w-32 sm:h-32 relative rounded-xl overflow-hidden shadow-md border-2 border-gray-100">
            <Image
              src={imageSrc}
              alt={offer.title}
              fill
              sizes="(max-width: 640px) 112px, 128px"
              className="object-cover"
              priority
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
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex-1">
                {offer.title}
              </h3>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusConfig.badge} flex-shrink-0`}>
                <StatusIcon className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {order.status}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {offer.description}
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <Package className="w-4 h-4" />
              <span>Quantity: {order.quantity}</span>
            </div>
          </div>
        </div>

        {/* Information Grid - Collapsible for non-pending orders */}
        {shouldShowDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 animate-in slide-in-from-top-2 duration-300">
            {/* Pickup Location */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Pickup Location
                </p>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {offer.owner?.location || offer.pickupLocation}
                </p>
                {(offer.owner?.mapsLink || offer.mapsLink) && (
                  <a
                    href={offer.owner?.mapsLink || offer.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in Maps
                  </a>
                )}
              </div>
            </div>

            {/* Expiration Date */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Pickup Deadline
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {expirationDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {expirationDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {isExpired && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    Expired
                  </span>
                )}
              </div>
            </div>

            {/* Order Date */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Ordered On
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {orderDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {orderDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Details Button - Only for non-pending orders */}
        {!isPending && (
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show Details
                </>
              )}
            </button>
          </div>
        )}

        {/* Actions Section - Only show for pending orders or when details are expanded */}
        {shouldShowDetails && (
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            {order.status === "pending" && order.qrCodeToken && (
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                <QrCode className="w-5 h-5" />
                {showQRCode ? "Hide QR Code" : "Show QR Code"}
                {showQRCode ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
            {order.status === "pending" && (
              <button
                onClick={handleCancelOrder}
                disabled={canceling}
                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  canceling
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg"
                }`}
              >
                <X className="w-5 h-5" />
                {canceling ? "Cancelling..." : "Cancel Order"}
              </button>
            )}
          </div>
        )}

        {/* QR Code Section (Collapsible) */}
        {order.status === "pending" && order.qrCodeToken && showQRCode && (
          <div className="mt-6 pt-6 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
            <OrderQRCode
              qrCodeToken={order.qrCodeToken}
              orderId={order.id}
              orderTitle={offer.title}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CartOrder;
