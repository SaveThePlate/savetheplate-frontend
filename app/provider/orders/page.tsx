"use client";
import React, { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  QrCode, 
  Search, 
  Phone, 
  MapPin, 
  Package, 
  Clock, 
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  XCircle,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { resolveImageSource, getImageFallbacks, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { formatDateTimeRange, isDateToday } from "@/components/offerCard/utils";
// WEBSOCKET INTEGRATION TEMPORARILY DISABLED
// import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load QRScanner to reduce initial bundle size (includes html5-qrcode library)
const QRScanner = dynamic(() => import("@/components/QRScanner"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading scanner...</p>
      </div>
    </div>
  ),
});

interface User {
  id: number;
  email?: string;
  username?: string;
  phoneNumber?: number | string;
  location?: string;
  profileImage?: string;
}

interface Offer {
  id: number;
  title?: string;
  images?: string | {
    filename?: string;
    alt?: string;
    url?: string;
    absoluteUrl?: string;
    original?: { url?: string };
  }[];
  pickupLocation?: string;
  expirationDate?: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
}

interface Order {
  id: number;
  quantity: number;
  offerId: number;
  userId: number;
  status: string;
  createdAt: string;
  user?: User;
  offer?: Offer;
}

const DEFAULT_IMAGE = "/defaultBag.png";

const ProviderOrdersContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useLanguage();

  // Prevent overscroll bounce on mobile
  useEffect(() => {
    const body = document.body;
    body.style.touchAction = "pan-x pan-y";
    
    return () => {
      body.style.touchAction = "";
    };
  }, []);

  // Fetch orders function - can be called to refresh
  const fetchOrders = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        // Don't redirect immediately - let the RouteGuard handle it
        setLoading(false);
        return;
      }

      // Get provider ID from token
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setProviderId(payload.id);
      } catch (parseError) {
        console.error("Failed to parse token:", parseError);
        // Don't throw - just continue without setting providerId
      }

      // Add cache-busting timestamp to ensure fresh data
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/provider?t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Safely set orders - ensure it's an array
      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      
      // Handle authentication errors
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        const errorMsg = t("provider.error_auth") || "Your session has expired. Please sign in again.";
        // Don't redirect immediately, let user see the error
        // They can manually sign in if needed
        setLoading(false);
        return;
      }
      
      // Handle network errors
      if (err?.code === 'ECONNABORTED' || err?.message === 'Network Error') {
        const errorMsg = t("provider.network_error") || "Network error. Please check your connection and try again.";
        setLoading(false);
        return;
      }
      
      // Handle other errors gracefully
      // Don't throw - just keep existing orders
      // This prevents the error from bubbling up to ErrorBoundary
      // Ensure orders is always an array even on error
      setOrders((prevOrders) => Array.isArray(prevOrders) ? prevOrders : []);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Fetch orders when component mounts
  useEffect(() => {
    // Wrap in try-catch to prevent any errors from bubbling up
    try {
      fetchOrders().catch((err) => {
        // fetchOrders already handles errors internally, but add extra safety
        console.error("Unhandled error in fetchOrders:", err);
      });
    } catch (err) {
      // Catch any synchronous errors
      console.error("Error in fetchOrders useEffect:", err);
      setLoading(false);
    }
  }, [fetchOrders]);

  // Check for error query parameter (from backend redirects)
  useEffect(() => {
    const error = searchParams.get('error');

    // Handle error query parameter
    if (error) {
      const errorMessage = decodeURIComponent(error);
      // Remove error parameter from URL
      router.replace('/provider/orders', { scroll: false });
    }
  }, [searchParams, router, t]);

  // WEBSOCKET INTEGRATION TEMPORARILY DISABLED - Using manual refresh instead
  // Handle real-time order updates
  // const handleOrderUpdate = useCallback((data: { type: string; order: any }) => {
  //   const { type, order } = data;
  //   
  //   setOrders((prevOrders) => {
  //     // Ensure prevOrders is always an array
  //     const safePrevOrders = Array.isArray(prevOrders) ? prevOrders : [];
  //     
  //     if (type === 'created') {
  //       // Add new order if it's for this provider's offers
  //       const offerIds = safePrevOrders.map(o => o.offerId);
  //       if (order.offerId && offerIds.includes(order.offerId)) {
  //         return [order, ...safePrevOrders];
  //       }
  //       // Or check if order is for provider's offer
  //       if (order.offer?.ownerId === providerId) {
  //         return [order, ...safePrevOrders];
  //       }
  //       return safePrevOrders;
  //     } else if (type === 'updated') {
  //       // Update existing order
  //       return safePrevOrders.map((o) => (o.id === order.id ? order : o));
  //     } else if (type === 'deleted') {
  //       // Remove deleted order
  //       return safePrevOrders.filter((o) => o.id !== order.id);
  //     }
  //     return safePrevOrders;
  //   });

  //   // Show toast notification
  //   if (type === 'updated' && order.status === 'confirmed') {
  //     toast.success(t("provider.order_confirmed_toast", { orderId: order.id }));
  //   }
  // }, [providerId, t]);

  // Connect to WebSocket for real-time updates
  // useWebSocket({
  //   onOrderUpdate: handleOrderUpdate,
  //   enabled: !!providerId,
  // });

  const handleScanSuccess = (qrCodeToken: string) => {
    // Close scanner immediately
    setShowScanner(false);
    // Show success toast
    // Refresh orders to get updated data (WebSocket should also update, but refetch to be sure)
    fetchOrders().catch((err) => {
      // Silently handle errors in fetchOrders - it already shows toast
      console.error("Error refreshing orders after scan:", err);
    });
  };

  // Ensure orders is always an array to prevent errors
  const safeOrders = useMemo(() => Array.isArray(orders) ? orders : [], [orders]);
  const confirmed = safeOrders.filter((o) => o.status === "confirmed");
  const pending = safeOrders.filter((o) => o.status === "pending");
  const cancelled = safeOrders.filter((o) => o.status === "cancelled");

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = safeOrders;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((order) => {
        const offerTitle = order.offer?.title?.toLowerCase() || "";
        const username = order.user?.username?.toLowerCase() || "";
        const phone = order.user?.phoneNumber?.toString() || "";
        const location = order.user?.location?.toLowerCase() || "";
        return (
          offerTitle.includes(query) ||
          username.includes(query) ||
          phone.includes(query) ||
          location.includes(query) ||
          order.id.toString().includes(query)
        );
      });
    }

    // Filter by status tab
    if (activeTab !== "all") {
      filtered = filtered.filter((o) => o.status === activeTab);
    }

    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [safeOrders, searchQuery, activeTab]);

  return (
    <main className="h-[100dvh] overflow-hidden pb-20 sm:pb-24 lg:pb-6 flex flex-col">
      <div className="w-full mx-auto px-3 sm:px-4 max-w-2xl lg:max-w-6xl pt-6 sm:pt-8 md:pt-10 lg:pt-12 flex flex-col h-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
          <div className="text-left flex-1">
            <h1 className="font-display font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">
              {t("provider.orders_title")}
            </h1>
          </div>
            <Button
              onClick={() => setShowScanner(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all"
              size="sm"
              title={t("provider.scan_qr_code")}
            >
              <QrCode size={18} className="sm:w-5 sm:h-5 md:w-6 md:h-6" />
            </Button>
        </div>

        {/* Stats Cards - Clickable Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-2 sm:mb-3 flex-shrink-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer ${
                activeTab === "all" ? "ring-2 ring-emerald-500 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{t("provider.total_orders")}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{safeOrders.length}</p>
                </div>
                <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ml-1 ${activeTab === "all" ? "bg-emerald-100" : "bg-emerald-50"}`}>
                  <ShoppingBag className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${activeTab === "all" ? "text-emerald-700" : "text-emerald-600"}`} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("pending")}
              className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer ${
                activeTab === "pending" ? "ring-2 ring-yellow-500 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{t("provider.pending_orders")}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-700">{pending.length}</p>
                </div>
                <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ml-1 ${activeTab === "pending" ? "bg-yellow-200" : "bg-yellow-100"}`}>
                  <Clock className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${activeTab === "pending" ? "text-yellow-800" : "text-yellow-700"}`} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("confirmed")}
              className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer ${
                activeTab === "confirmed" ? "ring-2 ring-emerald-500 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{t("provider.confirmed_orders")}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-700">{confirmed.length}</p>
                </div>
                <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ml-1 ${activeTab === "confirmed" ? "bg-emerald-200" : "bg-emerald-100"}`}>
                  <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${activeTab === "confirmed" ? "text-emerald-800" : "text-emerald-700"}`} />
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("cancelled")}
              className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer ${
                activeTab === "cancelled" ? "ring-2 ring-red-500 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{t("provider.cancelled_orders")}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-700">{cancelled.length}</p>
                </div>
                <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ml-1 ${activeTab === "cancelled" ? "bg-red-200" : "bg-red-100"}`}>
                  <XCircle className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${activeTab === "cancelled" ? "text-red-800" : "text-red-700"}`} />
                </div>
              </div>
            </button>
        </div>

        {/* Search Bar */}
        {!loading && safeOrders.length > 0 && (
          <div className="relative mb-2 sm:mb-3 flex-shrink-0">
            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <Input
              type="text"
              placeholder={t("provider.search_placeholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base border-2 border-gray-200 focus:border-emerald-500 rounded-lg sm:rounded-xl shadow-sm outline-none transition-colors bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle size={14} className="sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        )}

        {/* Tabs and Orders */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {loading ? (
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-md bg-white">
                <CardContent className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 sm:h-5 w-3/4" />
                      <Skeleton className="h-3 sm:h-4 w-1/2" />
                      <Skeleton className="h-3 sm:h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : safeOrders.length === 0 ? (
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-8 sm:p-12 md:p-16 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">
                {t("provider.no_orders")}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">
                {t("provider.no_orders_message")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full">
            {filteredOrders.length === 0 ? (
              <Card className="border-0 shadow-md bg-white">
                <CardContent className="p-8 sm:p-12 md:p-16 text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">
                    {searchQuery 
                      ? t("provider.no_orders_found")
                      : activeTab === "all"
                        ? t("provider.no_orders_found")
                        : t("provider.no_orders_for_status", { status: t(`provider.status.${activeTab}`).toLowerCase() })}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-4">
                    {searchQuery 
                      ? t("provider.try_adjusting_search")
                      : activeTab === "all" 
                        ? t("provider.no_orders_match_filters")
                        : t("provider.no_orders_for_status_message", { status: t(`provider.status.${activeTab}`).toLowerCase() })}
                  </p>
                  {searchQuery && (
                    <Button
                      onClick={() => setSearchQuery("")}
                      variant="outline"
                      className="mt-4 text-xs sm:text-sm"
                    >
                      {t("provider.clear_search")}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 pb-2 sm:pb-4">
                {filteredOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order}
                    onScanClick={() => setShowScanner(true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* QR Scanner Modal - Only render when needed */}
      {showScanner && providerId && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading scanner...</p>
            </div>
          </div>
        }>
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
            providerId={providerId}
          />
        </Suspense>
      )}

    </main>
  );
};

const OrderCard: React.FC<{ 
  order: Order;
  onScanClick?: () => void;
}> = ({ order, onScanClick }) => {
  const { t } = useLanguage();
  const offer = order.offer;
  const user = order.user;
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Format pickup deadline
  const pickupDeadline = offer?.expirationDate 
    ? formatDateTimeRange(offer.pickupStartTime, offer.pickupEndTime, offer.expirationDate)
    : null;
  const isPickupToday = offer?.expirationDate ? isDateToday(offer.expirationDate) : false;

  // Parse and get the first image from the offer, handling various formats
  const getOfferImageSrc = React.useCallback(() => {
    if (!offer?.images) {
      return DEFAULT_IMAGE;
    }

    let imagesArray: any[] = [];

    // Handle images as JSON string (from database)
    if (typeof offer.images === "string") {
      try {
        imagesArray = JSON.parse(offer.images);
      } catch {
        // If parsing fails, try as single string
        return resolveImageSource(offer.images);
      }
    } 
    // Handle images as array
    else if (Array.isArray(offer.images)) {
      imagesArray = offer.images;
    } else {
      return DEFAULT_IMAGE;
    }

    if (imagesArray.length === 0) {
      return DEFAULT_IMAGE;
    }

    const firstImage = imagesArray[0];
    
    // If first image is a string
    if (typeof firstImage === "string") {
      return resolveImageSource(firstImage);
    }

    // If first image is an object with image data
    return resolveImageSource(firstImage);
  }, [offer?.images]);

  const [currentImageSrc, setCurrentImageSrc] = useState(() => getOfferImageSrc());

  // Update image source when offer changes
  React.useEffect(() => {
    setCurrentImageSrc(getOfferImageSrc());
  }, [getOfferImageSrc]);

  const statusConfig = (s: string) => {
    switch (s) {
      case "pending":
        return { 
          bg: "bg-yellow-100", 
          text: "text-yellow-800", 
          border: "border-yellow-300",
          icon: Clock,
          label: t("provider.status.pending")
        };
      case "confirmed":
        return { 
          bg: "bg-emerald-100", 
          text: "text-emerald-800", 
          border: "border-emerald-300",
          icon: CheckCircle2,
          label: t("provider.status.confirmed")
        };
      case "cancelled":
        return { 
          bg: "bg-red-100", 
          text: "text-red-800", 
          border: "border-red-300",
          icon: XCircle,
          label: t("provider.status.cancelled")
        };
      default:
        return { 
          bg: "bg-gray-100", 
          text: "text-gray-800", 
          border: "border-gray-300",
          icon: AlertCircle,
          label: s
        };
    }
  };

  const status = statusConfig(order.status);
  const StatusIcon = status.icon;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const atStr = t("common.at") || "à";

    if (date.toDateString() === today.toDateString()) {
      return `${t("common.today")} ${atStr} ${timeStr}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${t("common.yesterday") || "Hier"} ${atStr} ${timeStr}`;
    } else {
      return date.toLocaleDateString([], { 
        month: "short", 
        day: "numeric", 
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      }) + ` ${atStr} ${timeStr}`;
    }
  };

  const handlePhoneClick = () => {
    if (user?.phoneNumber) {
      const phone = typeof user.phoneNumber === 'number' 
        ? user.phoneNumber.toString() 
        : user.phoneNumber;
      window.location.href = `tel:${phone}`;
    }
  };

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden bg-white">
      <CardContent className="p-0">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex items-start gap-3 sm:gap-4 md:gap-6">
            {/* Offer Image */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-100 shadow-sm">
              <Image
                src={sanitizeImageUrl(currentImageSrc)}
                alt={offer?.title || "Offer image"}
                fill
                sizes="96px"
                className="object-cover"
                unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImageSrc))}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  let imageSource: any = null;
                  
                  if (offer?.images) {
                    if (typeof offer.images === "string") {
                      try {
                        const parsed = JSON.parse(offer.images);
                        imageSource = Array.isArray(parsed) ? parsed[0] : parsed;
                      } catch {
                        imageSource = offer.images;
                      }
                    } else if (Array.isArray(offer.images) && offer.images.length > 0) {
                      imageSource = offer.images[0];
                    }
                  }
                  
                  const fallbacks = getImageFallbacks(imageSource);
                  const currentIndex = fallbacks.indexOf(currentImageSrc);
                  if (currentIndex < fallbacks.length - 1) {
                    setCurrentImageSrc(fallbacks[currentIndex + 1]);
                  } else {
                    target.src = DEFAULT_IMAGE;
                    setCurrentImageSrc(DEFAULT_IMAGE);
                  }
                }}
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-1 truncate">
                    {offer?.title || t("provider.offer_fallback")}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`${status.bg} ${status.text} ${status.border} border-2 flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1`}
                    >
                      <StatusIcon size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="font-semibold text-[10px] sm:text-xs">{status.label}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                  <UserIcon size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{t("provider.ordered_by")}</span>
                  <span className="font-semibold text-gray-900 truncate">
                    {user?.username || `User ${order.userId}`}
                  </span>
                </div>

                {user?.phoneNumber && (
                  <button
                    onClick={handlePhoneClick}
                    className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base text-emerald-600 hover:text-emerald-700 transition-colors group"
                  >
                    <Phone size={14} className="sm:w-4 sm:h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="font-medium truncate">
                      {typeof user.phoneNumber === 'number' 
                        ? user.phoneNumber.toString() 
                        : user.phoneNumber}
                    </span>
                  </button>
                )}

                {user?.location && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base text-gray-600">
                    <MapPin size={14} className="sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{user.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm md:text-base text-gray-600 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Package size={14} className="sm:w-4 sm:h-4 text-gray-400" />
                    <span>
                      <span className="font-semibold text-gray-900">{order.quantity}</span> {order.quantity === 1 ? t("provider.item") : t("provider.items")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Clock size={14} className="sm:w-4 sm:h-4 text-gray-400" />
                    <span className="text-[10px] sm:text-xs md:text-sm">
                      <span className="font-medium">{t("provider.ordered_on")}</span> {formatDate(order.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                  <div>
                    <span className="font-medium text-gray-700">{t("provider.order_number")}</span>
                    <span className="ml-1">{order.id}</span>
                  </div>
                  {pickupDeadline && (
                    <div>
                      <span className="font-medium text-gray-700">{t("provider.pickup_deadline_label")} </span>
                      <span>
                        {isPickupToday ? t("common.today") : pickupDeadline.date}
                        {pickupDeadline.time && (pickupDeadline.time.includes(" - ") 
                          ? ` ${t("common.between")} ${pickupDeadline.time}` 
                          : ` ${t("common.at")} ${pickupDeadline.time}`)}
                      </span>
                    </div>
                  )}
                  {offer?.pickupLocation && (
                    <div className="flex items-start gap-1.5 sm:gap-2">
                      <MapPin size={14} className="sm:w-4 sm:h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">{t("provider.pickup_location_label")} </span>
                        <span>{offer.pickupLocation}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 sm:gap-3 mt-3 sm:mt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={14} className="sm:w-4 sm:h-4" />
                      <span>{t("provider.show_less")}</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                      <span>{t("provider.show_details")}</span>
                    </>
                  )}
                </button>

                {order.status === "pending" && onScanClick && (
                  <Button
                    onClick={onScanClick}
                    size="sm"
                    className="gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
                  >
                    <QrCode size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t("provider.scan_qr")}</span>
                    <span className="sm:hidden">{t("provider.scan_mobile")}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProviderOrders = () => {
  return (
    <Suspense fallback={
      <main className="min-h-screen pt-24 pb-20 flex flex-col items-center justify-center">
        <div className="text-center bg-white rounded-xl p-6 shadow-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </main>
    }>
      <ProviderOrdersContent />
    </Suspense>
  );
};

export default ProviderOrders;
