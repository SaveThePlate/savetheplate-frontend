"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { ProviderOfferCard } from "@/components/offerCard";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, CheckCircle, XCircle, X, TrendingUp } from "lucide-react";
import { resolveImageSource } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";
// WEBSOCKET INTEGRATION TEMPORARILY DISABLED
// import { useWebSocket } from "@/hooks/useWebSocket";
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

type FilterType = "all" | "active" | "expired";

const ProviderHome = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const isMountedRef = useRef(true);

  // Prevent overscroll bounce on mobile
  useEffect(() => {
    const body = document.body;
    body.style.touchAction = "pan-x pan-y";
    
    return () => {
      body.style.touchAction = "";
    };
  }, []);

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

  // WEBSOCKET INTEGRATION TEMPORARILY DISABLED - Using manual refresh instead
  // Handle real-time offer updates
  // const handleOfferUpdate = useCallback((data: { type: string; offer: any }) => {
  //   if (!isMountedRef.current) return;
  //   
  //   const { type, offer } = data;
  //   
  //   // Get current user ID to filter offers
  //   const token = localStorage.getItem("accessToken");
  //   if (!token) return;
  //   
  //   let currentUserId: string | number | undefined;
  //   try {
  //     const tokenPayload = JSON.parse(atob(token.split(".")[1]));
  //     currentUserId = tokenPayload?.id;
  //   } catch (error) {
  //     console.error("Error parsing token:", error);
  //     return;
  //   }
  //   
  //   if (!currentUserId) {
  //     return;
  //   }
  //   
  //   // Only process offers that belong to this provider
  //   if (offer.ownerId !== currentUserId) {
  //     return;
  //   }
  //   
  //   // Normalize the offer data to match our format
  //   const normalizeOffer = (o: any): Offer => {
  //     const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  //     
  //     // Parse images if they're stored as JSON string (old offers)
  //     let imagesArray: any[] = [];
  //     if (o.images) {
  //       if (typeof o.images === 'string') {
  //         try {
  //           const parsed = JSON.parse(o.images);
  //           imagesArray = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
  //         } catch {
  //           // If parsing fails, try to use as single image URL
  //           imagesArray = o.images ? [{ url: o.images, absoluteUrl: o.images }] : [];
  //         }
  //       } else if (Array.isArray(o.images)) {
  //         imagesArray = o.images;
  //       }
  //     }
  //     
  //     const images = imagesArray.map((img: any) => {
  //       if (!img) return img;
  //       
  //       // Normalize absoluteUrl - preserve URLs from different backends
  //       if (typeof img.absoluteUrl === "string") {
  //         if (/^https?:\/\//i.test(img.absoluteUrl)) {
  //           try {
  //             const urlObj = new URL(img.absoluteUrl);
  //             const urlHost = urlObj.hostname;
  //             
  //             let currentBackendHost = "";
  //             if (backendOrigin) {
  //               try {
  //                 const backendUrlObj = new URL(backendOrigin);
  //                 currentBackendHost = backendUrlObj.hostname;
  //               } catch {
  //                 const match = backendOrigin.match(/https?:\/\/([^\/]+)/);
  //                 if (match) currentBackendHost = match[1];
  //               }
  //             }
  //             
  //             // If URL is from a different backend, keep it as-is
  //             if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
  //               return img; // Keep original URL from different backend
  //             }
  //             
  //             // Same backend - normalize
  //             const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
  //             if (match && backendOrigin) {
  //               return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
  //             }
  //           } catch {
  //             const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
  //             if (match && backendOrigin) {
  //               return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
  //             }
  //           }
  //         }
  //         else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
  //           return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
  //         }
  //       }
  //       
  //       // Normalize url field if it exists - same logic
  //       if (typeof img.url === "string" && /^https?:\/\//i.test(img.url)) {
  //         try {
  //           const urlObj = new URL(img.url);
  //           const urlHost = urlObj.hostname;
  //           
  //           let currentBackendHost = "";
  //           if (backendOrigin) {
  //             try {
  //               const backendUrlObj = new URL(backendOrigin);
  //               currentBackendHost = backendUrlObj.hostname;
  //             } catch {
  //               const match = backendOrigin.match(/https?:\/\/([^\/]+)/);
  //               if (match) currentBackendHost = match[1];
  //             }
  //           }
  //           
  //           // If from different backend, keep original
  //           if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
  //             return { ...img, absoluteUrl: img.absoluteUrl || img.url };
  //           }
  //           
  //           // Same backend - normalize
  //           const match = img.url.match(/\/(storage\/.+)$/);
  //           if (match && backendOrigin) {
  //             return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
  //           }
  //         } catch {
  //           const match = img.url.match(/\/(storage\/.+)$/);
  //           if (match && backendOrigin) {
  //             return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
  //           }
  //         }
  //       }
  //       
  //       return img;
  //     });
  //     
  //     return { ...o, images };
  //   };

  //   if (!isMountedRef.current) return;
  //   
  //   setOffers((prevOffers) => {
  //     if (type === 'created') {
  //       // Add new offer at the beginning
  //       const normalized = normalizeOffer(offer);
  //       return [normalized, ...prevOffers];
  //     } else if (type === 'updated') {
  //       // Update existing offer
  //       const normalized = normalizeOffer(offer);
  //       return prevOffers.map((o) => (o.id === offer.id ? normalized : o));
  //     } else if (type === 'deleted') {
  //       // Remove deleted offer
  //       return prevOffers.filter((o) => o.id !== offer.id);
  //     }
  //     return prevOffers;
  //   });
  // }, []);

  // Connect to WebSocket for real-time updates
  // useWebSocket({
  //   onOfferUpdate: handleOfferUpdate,
  //   enabled: true,
  // });

  const handleDeleteOffer = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    // Optimistic removal
    setOffers(prev => prev.filter(o => o.id !== id));

    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Success - show success toast
    } catch (err: any) {
      // Check if the response status indicates success (some backends might return 2xx but axios throws)
      // This handles cases where deletion succeeds but response handling causes an error
      const status = err?.response?.status;
      if (status >= 200 && status < 300) {
        // Success status code - treat as success, don't show error
        return;
      }
      
      // Only show error and refetch if it's actually an error (4xx or 5xx)
      const errorMsg = sanitizeErrorMessage(err, {
        action: "delete offer",
        defaultMessage: t("provider.home.delete_failed") || "Unable to delete offer. Please try again."
      });
      
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
    const active = offers.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0).length;
    const expired = offers.filter(o => isOfferExpired(o.expirationDate)).length;
    
    return {
      total: offers.length,
      active,
      expired,
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
    }

    return result;
  }, [offers, searchQuery, filter]);

  return (
    <main className="flex flex-col items-center w-full min-h-screen pb-20 sm:pb-24 lg:pb-6">
      <div className="w-full mx-auto px-3 sm:px-4 max-w-2xl lg:max-w-6xl pt-6 sm:pt-8 md:pt-10 lg:pt-12 space-y-3 sm:space-y-4 relative">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-3 sm:mb-4 flex-shrink-0">
          <div className="text-left flex-1">
            <h1 className="font-display font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl">
              {t("provider.home.title")}
            </h1>
          </div>
        </div>

        {/* Stats Section - Clickable Filters */}
        {!loading && offers.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3 flex-shrink-0">
            <button
              onClick={() => setFilter("all")}
              className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer ${
                filter === "all" ? "ring-2 ring-emerald-500 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{t("provider.home.stats.total")}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-foreground">{stats.total}</p>
                </div>
                <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ml-1 ${filter === "all" ? "bg-emerald-100" : "bg-emerald-50"}`}>
                  <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${filter === "all" ? "text-emerald-700" : "text-emerald-600"}`} />
                </div>
              </div>
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer ${
                filter === "active" ? "ring-2 ring-emerald-500 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{t("provider.home.stats.active")}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.active}</p>
                </div>
                <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ml-1 ${filter === "active" ? "bg-emerald-200" : "bg-emerald-100"}`}>
                  <CheckCircle className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${filter === "active" ? "text-emerald-800" : "text-emerald-700"}`} />
                </div>
              </div>
            </button>
            <button
              onClick={() => setFilter("expired")}
              className={`bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border-0 shadow-md hover:shadow-lg transition-all duration-200 text-left cursor-pointer ${
                filter === "expired" ? "ring-2 ring-red-500 scale-[1.02]" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mb-0.5 sm:mb-1 truncate">{t("provider.home.stats.expired")}</p>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-red-700">{stats.expired}</p>
                </div>
                <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg flex-shrink-0 ml-1 ${filter === "expired" ? "bg-red-200" : "bg-red-100"}`}>
                  <XCircle className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${filter === "expired" ? "text-red-800" : "text-red-700"}`} />
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Search and Filters */}
        {!loading && offers.length > 0 && (
          <div className="space-y-2 sm:space-y-3 mb-2 sm:mb-3 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder={t("provider.home.search_placeholder") || "Search offers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 md:py-3 bg-white border-2 border-border focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-lg sm:rounded-xl shadow-sm text-xs sm:text-sm md:text-base outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Offers Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-emerald-600 mb-3 sm:mb-4"></div>
            <p className="text-muted-foreground text-xs sm:text-sm">{t("provider.home.loading_offers")}</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
            <p className="text-red-600 text-xs sm:text-sm">{error}</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh] sm:min-h-[70vh]">
            <div className="bg-white rounded-xl border-0 shadow-md p-8 sm:p-12 md:p-16 text-center w-full max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <PlusCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2">
                {t("provider.home.empty_state_title")}
              </h3>
              <p className="text-muted-foreground mb-4 sm:mb-6 text-xs sm:text-sm md:text-base">
                {t("provider.home.empty_state_description")}
              </p>
              <button
                onClick={() => router.push("./publish")}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:bg-emerald-700 transition duration-300 transform hover:scale-[1.02] text-xs sm:text-sm md:text-base"
              >
                <PlusCircle size={16} className="sm:w-5 sm:h-5" />
                {t("provider.home.publish_offer")}
              </button>
            </div>
          </div>
        ) : filteredAndSortedOffers.length === 0 ? (
          <div className="bg-white rounded-xl border-0 shadow-md p-6 sm:p-8 md:p-12 text-center">
            <p className="text-muted-foreground text-xs sm:text-sm md:text-base lg:text-lg">
              {t("provider.home.no_results")}
            </p>
          </div>
        ) : (
          <div data-tour="offers-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pb-2 sm:pb-4">
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
          const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
          
          const normalizeImages = (images: any) => {
            if (!Array.isArray(images)) return [];
            return images.map((img: any) => {
              if (!img) return img;
              if (typeof img.absoluteUrl === "string" && img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
              }
              if (typeof img.url === "string" && img.url.startsWith("/storage/") && backendOrigin) {
                return { ...img, url: `${backendOrigin}${img.url}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${img.url}` };
              }
              return img;
            });
          };
          
          let imagesToUse: any[] = [];
          if (data?.images) {
            if (typeof data.images === 'string') {
              try {
                const parsed = JSON.parse(data.images);
                imagesToUse = Array.isArray(parsed) ? parsed : [];
              } catch {
                imagesToUse = [];
              }
            } else if (Array.isArray(data.images)) {
              imagesToUse = data.images;
            }
          }
          
          if (imagesToUse.length > 0) {
            const normalizedImages = normalizeImages(imagesToUse);
            setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data, images: normalizedImages } : o));
            return;
          }
          
          // Refetch if no images in response
          try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            
            const response = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${id}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const updatedOffer = response.data;
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
            setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updatedOffer, images: normalizedImages } : o));
          } catch (err) {
            console.error("Failed to refetch updated offer:", err);
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
