"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";
import { QrCode, RefreshCw } from "lucide-react";
import { resolveImageSource, getImageFallbacks } from "@/utils/imageUtils";

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

const ProviderOrders = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [providerId, setProviderId] = useState<number | null>(null);

  // Fetch orders function - can be called to refresh
  const fetchOrders = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      // Get provider ID from token
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setProviderId(payload.id);
      } catch {
        console.error("Failed to parse token");
      }

      // Add cache-busting timestamp to ensure fresh data
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/provider?t=${Date.now()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch provider orders");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Fetch orders when component mounts
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleScanSuccess = (qrCodeToken: string) => {
    toast.success("Order confirmed successfully!");
    setShowScanner(false);
    // Refresh orders to get updated data
    fetchOrders();
  };

  const confirmed = orders.filter((o) => o.status === "confirmed");
  const pending = orders.filter((o) => o.status === "pending");
  const cancelled = orders.filter((o) => o.status === "cancelled");

  return (
    <main className="bg-[#e8f4ee] min-h-screen pt-24 pb-20 flex flex-col items-center">
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

      <div className="w-full max-w-6xl px-4">
        <div className="w-full flex items-center justify-between mb-6 pt-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
            Orders for your offers
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
              title="Refresh orders to see latest customer information"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <QrCode size={20} />
              Scan QR Code
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 flex flex-wrap gap-4">
          {[
            { label: "Total orders", value: orders.length, bg: "bg-gray-100", text: "text-gray-900" },
            { label: "Confirmed", value: confirmed.length, bg: "bg-white", text: "text-emerald-700" },
            { label: "Pending", value: pending.length, bg: "bg-white", text: "text-yellow-800" },
            { label: "Cancelled", value: cancelled.length, bg: "bg-white", text: "text-red-700" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg shadow-sm ${stat.bg} flex flex-col items-center`}
            >
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.text}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-600">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-600">No orders for your offers yet.</p>
        ) : (
          <div className="flex flex-col gap-6">
            {["pending", "confirmed", "cancelled"].map((status) => {
              const list = orders.filter((o) => o.status === status);
              if (!list.length) return null;
              return (
                <section key={status}>
                  <h2 className="text-xl font-semibold text-gray-700 mb-3 capitalize">{status}</h2>
                  <div className="flex flex-col gap-4">
                    {list.map((order) => (
                      <OrderCard 
                        key={order.id} 
                        order={order}
                        onScanClick={() => setShowScanner(true)}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      {showScanner && providerId && (
        <QRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
          providerId={providerId}
        />
      )}
    </main>
  );
};

const OrderCard: React.FC<{ 
  order: Order;
  onScanClick?: () => void;
}> = ({ order, onScanClick }) => {
  const offer = order.offer;
  const user = order.user;

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

  const statusClass = (s: string) => {
    switch (s) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition">
      <div className="w-20 h-20 rounded-lg overflow-hidden relative flex-shrink-0 bg-gray-100">
        <Image
          src={currentImageSrc}
          alt={offer?.title || "Offer image"}
          fill
          sizes="80px"
          className="object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            // Try fallbacks
            let imageSource: any = null;
            
            // Parse images if needed
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

      <div className="flex-1 min-w-0">
        <h3 className="text-md font-semibold text-gray-900 truncate">{offer?.title || "Offer"}</h3>
        <p className="text-sm text-gray-600">
          Ordered by:{" "}
          <span className="font-medium text-gray-800">
            {user?.username || `User ${order.userId}`}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          Phone:{" "}
          <span className="font-medium text-gray-800">
            {user?.phoneNumber 
              ? (typeof user.phoneNumber === 'number' ? user.phoneNumber.toString() : user.phoneNumber)
              : 'N/A'}
          </span>
        </p>
        {user?.location && (
          <p className="text-sm text-gray-500">
            Location: <span className="font-medium text-gray-700">{user.location}</span>
          </p>
        )}
        <p className="text-sm text-gray-500">
          Quantity: <span className="font-medium">{order.quantity}</span>
        </p>
        <p className="text-sm text-gray-500">
          Ordered on:{" "}
        <span className="font-medium">
          {new Date(order.createdAt).toLocaleDateString()}{" "}
          at {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        </p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClass(order.status)}`}>
          {order.status.toUpperCase()}
        </span>
        {order.status === "pending" && onScanClick && (
          <button
            onClick={onScanClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
            title="Scan customer's QR code to confirm pickup"
          >
            <QrCode size={14} />
            Scan QR
          </button>
        )}
      </div>
    </div>
  );
};

export default ProviderOrders;
