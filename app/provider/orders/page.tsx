"use client";
import React, { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  QrCode, 
  RefreshCw, 
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
// WEBSOCKET INTEGRATION TEMPORARILY DISABLED
// import { useWebSocket } from "@/hooks/useWebSocket";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
        toast.error(errorMsg);
        // Don't redirect immediately, let user see the error
        // They can manually sign in if needed
        setLoading(false);
        return;
      }
      
      // Handle network errors
      if (err?.code === 'ECONNABORTED' || err?.message === 'Network Error') {
        const errorMsg = t("provider.network_error") || "Network error. Please check your connection and try again.";
        toast.error(errorMsg);
        setLoading(false);
        return;
      }
      
      // Handle other errors gracefully
      const errorMsg = sanitizeErrorMessage(err, {
        action: "load orders",
        defaultMessage: t("provider.fetch_failed") || "Unable to load orders. Please try again later."
      });
      toast.error(errorMsg);
      
      // Don't throw - just show error toast and keep existing orders
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
      toast.error(errorMessage || t("provider.error_scanning") || "An error occurred while scanning the QR code");
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
    toast.success(t("orders.confirmed") || "Order confirmed successfully");
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
    <main className="flex flex-col items-center w-full">
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

      <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-6xl pt-4 sm:pt-6 space-y-6 sm:space-y-8 relative">
        {/* Decorative soft shapes */}
        <div className="absolute top-0 left-[-4rem] w-40 h-40 bg-[#FFD6C9] rounded-full blur-3xl opacity-40 -z-10" />
        <div className="absolute bottom-10 right-[-3rem] w-32 h-32 bg-[#C8E3F8] rounded-full blur-2xl opacity-40 -z-10" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="text-left space-y-1 sm:space-y-2 flex-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#344e41] tracking-tight">
              {t("provider.orders_title")}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base font-medium">
              Manage and track all orders for your offers
            </p>
          </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                onClick={fetchOrders}
                variant="outline"
                size="default"
                className="gap-2"
                disabled={loading}
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                <span className="hidden sm:inline">{t("provider.refresh")}</span>
              </Button>
              <Button
                onClick={() => setShowScanner(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                size="default"
              >
                <QrCode size={20} />
                <span className="hidden sm:inline">{t("provider.scan_qr_code")}</span>
                <span className="sm:hidden">Scan</span>
              </Button>
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t("provider.total_orders")}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">{safeOrders.length}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-100 rounded-lg">
                    <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t("provider.pending_orders")}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-700">{pending.length}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t("provider.confirmed_orders")}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{confirmed.length}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-emerald-100 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-1">{t("provider.cancelled_orders")}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-red-700">{cancelled.length}</p>
                  </div>
                  <div className="p-2 sm:p-3 bg-red-100 rounded-lg">
                    <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search by order ID, customer name, phone, or offer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-6 sm:py-7 text-base border-2 border-gray-200 focus:border-emerald-500 rounded-xl shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            )}
        </div>

        {/* Tabs and Orders */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-md">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : safeOrders.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 sm:p-16 text-center">
              <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("provider.no_orders")}
              </h3>
              <p className="text-gray-600">
                Orders will appear here once customers place orders for your offers
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-white shadow-sm border border-gray-200 rounded-xl p-1 h-auto">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-2.5 sm:py-3 text-sm sm:text-base"
              >
                All ({safeOrders.length})
              </TabsTrigger>
              <TabsTrigger 
                value="pending" 
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Pending ({pending.length})
              </TabsTrigger>
              <TabsTrigger 
                value="confirmed" 
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Confirmed ({confirmed.length})
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled" 
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white py-2.5 sm:py-3 text-sm sm:text-base"
              >
                Cancelled ({cancelled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {filteredOrders.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-12 sm:p-16 text-center">
                    <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchQuery ? "No orders found" : `No ${activeTab === "all" ? "" : activeTab} orders`}
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? "Try adjusting your search criteria"
                        : activeTab === "all" 
                          ? "No orders match your filters"
                          : `You don't have any ${activeTab} orders at the moment`}
                    </p>
                    {searchQuery && (
                      <Button
                        onClick={() => setSearchQuery("")}
                        variant="outline"
                        className="mt-4"
                      >
                        Clear Search
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order}
                      onScanClick={() => setShowScanner(true)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* QR Scanner Modal - Only render when needed */}
      {showScanner && providerId && (
        <Suspense fallback={
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading scanner...</p>
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

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: "short", 
        day: "numeric", 
        year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined
      }) + ` at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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
    <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 sm:p-6">
          <div className="flex items-start gap-4 sm:gap-6">
            {/* Offer Image */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden relative flex-shrink-0 bg-gray-100 shadow-sm">
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
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 truncate">
                    {offer?.title || "Offer"}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge 
                      variant="outline" 
                      className={`${status.bg} ${status.text} ${status.border} border-2 flex items-center gap-1.5 px-3 py-1`}
                    >
                      <StatusIcon size={14} />
                      <span className="font-semibold">{status.label}</span>
                    </Badge>
                    <span className="text-xs sm:text-sm text-gray-500">
                      Order #{order.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <UserIcon size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600">{t("provider.ordered_by")}</span>
                  <span className="font-semibold text-gray-900">
                    {user?.username || `User ${order.userId}`}
                  </span>
                </div>

                {user?.phoneNumber && (
                  <button
                    onClick={handlePhoneClick}
                    className="flex items-center gap-2 text-sm sm:text-base text-emerald-600 hover:text-emerald-700 transition-colors group"
                  >
                    <Phone size={16} className="text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="font-medium">
                      {typeof user.phoneNumber === 'number' 
                        ? user.phoneNumber.toString() 
                        : user.phoneNumber}
                    </span>
                  </button>
                )}

                {user?.location && (
                  <div className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                    <MapPin size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{user.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-4 text-sm sm:text-base text-gray-600">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-gray-400" />
                    <span>
                      <span className="font-semibold text-gray-900">{order.quantity}</span> {order.quantity === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-xs sm:text-sm">{formatDate(order.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm text-gray-600">
                  {offer?.pickupLocation && (
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">Pickup Location: </span>
                        <span>{offer.pickupLocation}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Order Date: </span>
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 mt-4">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp size={16} />
                      <span>Show Less</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      <span>Show Details</span>
                    </>
                  )}
                </button>

                {order.status === "pending" && onScanClick && (
                  <Button
                    onClick={onScanClick}
                    size="sm"
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <QrCode size={16} />
                    <span className="hidden sm:inline">{t("provider.scan_qr")}</span>
                    <span className="sm:hidden">Scan</span>
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
      <main className="bg-[#e8f4ee] min-h-screen pt-24 pb-20 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    }>
      <ProviderOrdersContent />
    </Suspense>
  );
};

export default ProviderOrders;
