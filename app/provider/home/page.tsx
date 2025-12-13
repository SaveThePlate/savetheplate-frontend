"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProviderOfferCard } from "@/components/offerCard";
import { useRouter } from "next/navigation";
import { PlusCircle, Filter, Search, TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";
import { resolveImageSource } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";
import { isOfferExpired } from "@/components/offerCard/utils";
import { sanitizeErrorMessage } from "@/utils/errorUtils";

type FoodType = "snack" | "meal" | "beverage" | "other";
type Taste = "sweet" | "salty" | "both" | "neutral";

interface Offer {
  price: number;
  originalPrice?: number;
  quantity: number;
  id: number;
  ownerId: number;
  // backend may return images as array of objects (with filename or path), or attach imageFileName directly
  images?: {
    filename?: string;
    alt?: string;
    url?: string;
    path?: string;
    absoluteUrl?: string;
    original?: { url?: string };
  }[];
  imageFileName?: string;
  title: string;
  description: string;
  expirationDate: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupLocation: string;
  mapsLink: string;
  foodType?: FoodType;
  taste?: Taste;
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
  };
}

const DEFAULT_PROFILE_IMAGE = "/defaultBag.png";

type FilterType = "all" | "active" | "expired" | "low_stock";
type SortType = "newest" | "oldest" | "price_low" | "price_high" | "quantity_low";
type CategoryFilterType = "all" | FoodType;
type TasteFilterType = "all" | Taste;

const ProviderHome = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterType>("all");
  const [tasteFilter, setTasteFilter] = useState<TasteFilterType>("all");
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return router.push("/signIn");

        const headers = { Authorization: `Bearer ${token}` };
        let id: string | number | undefined;
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          id = tokenPayload?.id;
        } catch (error) {
          console.error("Error parsing token:", error);
          // Try to get userId from API if token parsing fails
          try {
            const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers });
            id = userResponse.data?.id;
          } catch (apiError) {
            console.error("Error fetching user info:", apiError);
            return;
          }
        }

        if (!id) {
          console.error("Could not determine user ID");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`,
          { headers }
        );

        if (!isMountedRef.current) return;

        // normalize images array - preserve URLs from different backends, only normalize relative paths
        const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
        const mappedOffers: Offer[] = response.data.map((o: any) => {
          const images = Array.isArray(o.images) ? o.images.map((img: any) => {
            if (!img) return img;
            
            // Normalize absoluteUrl - preserve URLs from different backends
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
                  
                  // If URL is from a different backend, keep it as-is
                  if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
                    return img; // Keep original URL from different backend
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
              }
              else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
              }
            }
            
            // Normalize url field if it exists - same logic
            if (typeof img.url === "string" && /^https?:\/\//i.test(img.url)) {
              try {
                const urlObj = new URL(img.url);
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
                
                // If from different backend, keep original
                if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
                  return { ...img, absoluteUrl: img.absoluteUrl || img.url };
                }
                
                // Same backend - normalize
                const match = img.url.match(/\/(storage\/.+)$/);
                if (match && backendOrigin) {
                  return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
                }
              } catch {
                const match = img.url.match(/\/(storage\/.+)$/);
                if (match && backendOrigin) {
                  return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
                }
              }
            }
            
            return img;
          }) : [];

          return { ...o, images };
        });

        setOffers(mappedOffers);
      } catch (err: any) {
        if (isMountedRef.current) {
          // Provide user-friendly error message without technical details
          let userMessage = t("provider.home.fetch_offers_failed") || "Unable to load your offers. Please try again.";
          
          if (err?.response?.status === 401 || err?.response?.status === 403) {
            userMessage = t("provider.home.error_auth") || "Your session has expired. Please sign in again.";
            router.push("/signIn");
          } else if (err?.response?.status === 500) {
            userMessage = t("provider.home.error_server") || "Server error. Please try again in a moment.";
          }
          
          setError(userMessage);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchOffers();
  }, [router, t]);

  // Handle real-time offer updates
  const handleOfferUpdate = useCallback((data: { type: string; offer: any }) => {
    if (!isMountedRef.current) return;
    
    const { type, offer } = data;
    
    // Get current user ID to filter offers
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    
    let currentUserId: string | number | undefined;
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      currentUserId = tokenPayload?.id;
    } catch (error) {
      console.error("Error parsing token:", error);
      return;
    }
    
    if (!currentUserId) {
      return;
    }
    
    // Only process offers that belong to this provider
    if (offer.ownerId !== currentUserId) {
      return;
    }
    
    // Normalize the offer data to match our format
    const normalizeOffer = (o: any): Offer => {
      const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      
      // Parse images if they're stored as JSON string (old offers)
      let imagesArray: any[] = [];
      if (o.images) {
        if (typeof o.images === 'string') {
          try {
            const parsed = JSON.parse(o.images);
            imagesArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
          } catch {
            // If parsing fails, try to use as single image URL
            imagesArray = o.images ? [{ url: o.images, absoluteUrl: o.images }] : [];
          }
        } else if (Array.isArray(o.images)) {
          imagesArray = o.images;
        }
      }
      
      const images = imagesArray.map((img: any) => {
        if (!img) return img;
        
        // Normalize absoluteUrl - preserve URLs from different backends
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
              
              // If URL is from a different backend, keep it as-is
              if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
                return img; // Keep original URL from different backend
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
          }
          else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
            return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
          }
        }
        
        // Normalize url field if it exists - same logic
        if (typeof img.url === "string" && /^https?:\/\//i.test(img.url)) {
          try {
            const urlObj = new URL(img.url);
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
            
            // If from different backend, keep original
            if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
              return { ...img, absoluteUrl: img.absoluteUrl || img.url };
            }
            
            // Same backend - normalize
            const match = img.url.match(/\/(storage\/.+)$/);
            if (match && backendOrigin) {
              return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
            }
          } catch {
            const match = img.url.match(/\/(storage\/.+)$/);
            if (match && backendOrigin) {
              return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
            }
          }
        }
        
        return img;
      });
      
      return { ...o, images };
    };

    if (!isMountedRef.current) return;
    
    setOffers((prevOffers) => {
      if (type === 'created') {
        // Add new offer at the beginning
        const normalized = normalizeOffer(offer);
        return [normalized, ...prevOffers];
      } else if (type === 'updated') {
        // Update existing offer
        const normalized = normalizeOffer(offer);
        return prevOffers.map((o) => (o.id === offer.id ? normalized : o));
      } else if (type === 'deleted') {
        // Remove deleted offer
        return prevOffers.filter((o) => o.id !== offer.id);
      }
      return prevOffers;
    });
  }, []);

  // Connect to WebSocket for real-time updates
  useWebSocket({
    onOfferUpdate: handleOfferUpdate,
    enabled: true,
  });

  const handleDeleteOffer = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    // Optimistic removal
    setOffers(prev => prev.filter(o => o.id !== id));

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(t("provider.home.offer_deleted"));
    } catch (err: any) {
      const errorMsg = sanitizeErrorMessage(err, {
        action: "delete offer",
        defaultMessage: t("provider.home.delete_failed") || "Unable to delete offer. Please try again."
      });
      toast.error(errorMsg);
      // refetch if failed
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        let userId: string | number | undefined;
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          userId = tokenPayload?.id;
        } catch (parseError) {
          console.error("Error parsing token:", parseError);
          // Try to get userId from API if token parsing fails
          try {
            const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers });
            userId = userResponse.data?.id;
          } catch (apiError) {
            console.error("Error fetching user info:", apiError);
            setLoading(false);
            return;
          }
        }
        
        if (userId) {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${userId}`,
            { headers }
          );
          setOffers(response.data);
        }
      } catch (refetchError) {
        console.error("Error refetching offers:", refetchError);
      } finally {
        setLoading(false);
      }
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    const now = Date.now();
    const active = offers.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0).length;
    const expired = offers.filter(o => isOfferExpired(o.expirationDate)).length;
    const lowStock = offers.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0 && o.quantity <= 5).length;
    
    return {
      total: offers.length,
      active,
      expired,
      lowStock,
    };
  }, [offers]);

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let result = [...offers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(offer =>
        offer.title.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query) ||
        offer.pickupLocation.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filter === "active") {
      result = result.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0);
    } else if (filter === "expired") {
      result = result.filter(o => isOfferExpired(o.expirationDate));
    } else if (filter === "low_stock") {
      result = result.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0 && o.quantity <= 5);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter(o => o.foodType === categoryFilter);
    }

    // Apply taste filter
    if (tasteFilter !== "all") {
      result = result.filter(o => o.taste === tasteFilter || o.taste === "both");
    }

    // Apply sorting
    switch (sort) {
      case "newest":
        result.sort((a, b) => new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
        break;
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "quantity_low":
        result.sort((a, b) => a.quantity - b.quantity);
        break;
    }

    return result;
  }, [offers, searchQuery, filter, sort, categoryFilter, tasteFilter]);

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
              {t("provider.home.title")}
            </h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base font-medium">
              {t("provider.home.subtitle")}
            </p>
          </div>
          <button
            data-tour="publish-button"
            onClick={() => router.push("./publish")}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-700 transition duration-300 transform hover:scale-[1.02] min-h-[48px] w-full sm:w-auto"
          >
            <PlusCircle size={22} />
            {t("provider.home.publish_offer")}
          </button>
        </div>

        {/* Stats Section */}
        {!loading && offers.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">{t("provider.home.stats.total")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">{t("provider.home.stats.active")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">{t("provider.home.stats.expired")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">{t("provider.home.stats.low_stock")}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.lowStock}</p>
            </div>
          </div>
        )}

        {/* Search and Filter Section */}
        {!loading && offers.length > 0 && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t("provider.home.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterType)}
                  className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
                >
                  <option value="all">{t("provider.home.filter_all")}</option>
                  <option value="active">{t("provider.home.filter_active")}</option>
                  <option value="expired">{t("provider.home.filter_expired")}</option>
                  <option value="low_stock">{t("provider.home.filter_low_stock")}</option>
                </select>
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilterType)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
              >
                <option value="all">{t("provider.home.category_all")}</option>
                <option value="snack">{t("provider.home.category_snack")}</option>
                <option value="meal">{t("provider.home.category_meal")}</option>
                <option value="beverage">{t("provider.home.category_beverage")}</option>
                <option value="other">{t("provider.home.category_other")}</option>
              </select>

              {/* Taste Filter */}
              <select
                value={tasteFilter}
                onChange={(e) => setTasteFilter(e.target.value as TasteFilterType)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
              >
                <option value="all">{t("provider.home.taste_all")}</option>
                <option value="sweet">{t("provider.home.taste_sweet")}</option>
                <option value="salty">{t("provider.home.taste_salty")}</option>
                <option value="both">{t("provider.home.taste_both")}</option>
                <option value="neutral">{t("provider.home.taste_neutral")}</option>
              </select>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
              >
                <option value="newest">{t("provider.home.sort_newest")}</option>
                <option value="oldest">{t("provider.home.sort_oldest")}</option>
                <option value="price_low">{t("provider.home.sort_price_low")}</option>
                <option value="price_high">{t("provider.home.sort_price_high")}</option>
                <option value="quantity_low">{t("provider.home.sort_quantity_low")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Offers Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600 text-lg">{t("provider.home.loading_offers")}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlusCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t("provider.home.empty_state_title")}
              </h3>
              <p className="text-gray-600 mb-6">
                {t("provider.home.empty_state_description")}
              </p>
              <button
                onClick={() => router.push("./publish")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:bg-emerald-700 transition duration-300 transform hover:scale-[1.02]"
              >
                <PlusCircle size={20} />
                {t("provider.home.publish_offer")}
              </button>
            </div>
          </div>
        ) : filteredAndSortedOffers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <p className="text-gray-600 text-lg">
              {t("provider.home.no_results")}
            </p>
          </div>
        ) : (
          <div data-tour="offers-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedOffers.map((offer) => {
  // Handle images - might be array, JSON string, or undefined
  let imagesArray: any[] = [];
  if (offer.images) {
    if (typeof offer.images === 'string') {
      try {
        const parsed = JSON.parse(offer.images);
        imagesArray = Array.isArray(parsed) ? parsed : [];
      } catch {
        imagesArray = [];
      }
    } else if (Array.isArray(offer.images)) {
      imagesArray = offer.images;
    }
  }
  
  const firstImage = imagesArray?.[0] || (offer.imageFileName ? { filename: offer.imageFileName } : null);
  // Use unified image resolution
  const imageSrc = resolveImageSource(firstImage);

  // Prioritize offer's specific pickupLocation over owner's general location (matches backend logic)
  const currentLocation = (offer.pickupLocation && offer.pickupLocation.trim() !== '') ? offer.pickupLocation : (offer.owner?.location || offer.pickupLocation);
  const currentMapsLink = (offer.mapsLink && offer.mapsLink.trim() !== '') ? offer.mapsLink : (offer.owner?.mapsLink || offer.mapsLink);

  return (
      <ProviderOfferCard
        key={offer.id}
        offerId={offer.id}
        imageSrc={imageSrc}
        imageAlt={offer.title}
        title={offer.title}
        price={offer.price}
        originalPrice={offer.originalPrice}
        quantity={offer.quantity}
        description={offer.description}
        expirationDate={offer.expirationDate}
        pickupStartTime={offer.pickupStartTime}
        pickupEndTime={offer.pickupEndTime}
        pickupLocation={offer.owner?.location || currentLocation}
        mapsLink={currentMapsLink}
        foodType={offer.foodType}
        taste={offer.taste}
        ownerId={offer.ownerId}
        onDelete={handleDeleteOffer}
        onUpdate={async (id, data) => {
          console.log("🔄 onUpdate called with id:", id, "data:", data);
          console.log("🔄 data.images:", data?.images);
          console.log("🔄 data.images is array?", Array.isArray(data?.images));
          console.log("🔄 data.images type:", typeof data?.images);
          
          // Check if data is already the updated offer object (from PUT response)
          const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
          
          // Normalize images array helper
          const normalizeImages = (images: any) => {
            if (!Array.isArray(images)) {
              console.log("⚠️ normalizeImages: not an array, returning empty");
              return [];
            }
            return images.map((img: any) => {
              if (!img) return img;
              
              // Normalize absoluteUrl
              if (typeof img.absoluteUrl === "string") {
                if (/^https?:\/\//i.test(img.absoluteUrl)) {
                  const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
                  }
                } else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                  return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
                }
              }
              
              // Normalize url field
              if (typeof img.url === "string" && /^https?:\/\//i.test(img.url)) {
                const match = img.url.match(/\/(storage\/.+)$/);
                if (match && backendOrigin) {
                  return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
                }
              }
              
              return img;
            });
          };
          
          // Handle images - they might be an array, JSON string, or undefined
          let imagesToUse: any[] = [];
          
          if (data && data.images) {
            // Check if images is a JSON string (from backend)
            if (typeof data.images === 'string') {
              try {
                const parsed = JSON.parse(data.images);
                imagesToUse = Array.isArray(parsed) ? parsed : [];
              } catch {
                console.warn("Failed to parse images JSON string");
                imagesToUse = [];
              }
            } else if (Array.isArray(data.images)) {
              imagesToUse = data.images;
            }
          }
          
          // If we have images, normalize and update
          if (imagesToUse.length > 0) {
            console.log("✅ Using images from PUT response directly");
            const normalizedImages = normalizeImages(imagesToUse);
            setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data, images: normalizedImages } : o));
            return;
          }
          
          console.log("⚠️ Images not found in response, refetching...");
          
          // Otherwise, refetch the updated offer to get the latest data including images
          try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const updatedOffer = response.data;
            // Handle images from refetch - might be array or JSON string
            let refetchImages: any[] = [];
            if (updatedOffer.images) {
              if (typeof updatedOffer.images === 'string') {
                try {
                  const parsed = JSON.parse(updatedOffer.images);
                  refetchImages = Array.isArray(parsed) ? parsed : [];
                } catch {
                  refetchImages = [];
                }
              } else if (Array.isArray(updatedOffer.images)) {
                refetchImages = updatedOffer.images;
              }
            }
            
            const normalizedImages = normalizeImages(refetchImages);
            
            // Update the offer in state with normalized data
            setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updatedOffer, images: normalizedImages } : o));
          } catch (err) {
            console.error("Failed to refetch updated offer:", err);
            // Fallback to manual update if refetch fails
            setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
          }
        }}
        owner={offer.owner ? {
          id: offer.owner.id,
          username: offer.owner.username,
          location: offer.owner.location,
          profileImage: offer.owner.profileImage,
        } : undefined}
      />
    );
  })}

          </div>
        )}
      </div>
    </main>
  );
};

export default ProviderHome;
