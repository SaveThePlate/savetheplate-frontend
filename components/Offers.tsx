"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { ClientOfferCard } from "./offerCard";
import { useRouter } from "next/navigation";
import { resolveImageSource } from "@/utils/imageUtils";
import { getBackendOrigin } from "@/lib/backendOrigin";
// WEBSOCKET INTEGRATION TEMPORARILY DISABLED
// import { useWebSocket } from "@/hooks/useWebSocket";
import { useLanguage } from "@/context/LanguageContext";
import { Search, Filter, X, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isOfferExpired } from "./offerCard/utils";
import { calculateDistance, formatDistance } from "@/utils/distanceUtils";

interface Offer {
  id: number;
  images?: {
    filename: string;
    alt?: string;
    url?: string;
    absoluteUrl: string;
    original?: { url?: string };
  }[];
  title: string;
  ownerId: number;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  expirationDate: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupLocation: string;
  mapsLink: string;
  latitude?: number | null;
  longitude?: number | null;
  foodType?: "snack" | "meal" | "beverage" | "other";
  taste?: "sweet" | "salty" | "both" | "neutral";
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  user?: { username: string }; // Legacy field
  averageRating?: number;
  totalRatings?: number;
}

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

type FilterType = "all" | "available" | "low_stock";
type SortType = "newest" | "price_low" | "price_high" | "earliest_pickup" | "distance";
type FoodTypeFilter = "all" | "snack" | "meal" | "beverage" | "other";
type TasteFilter = "all" | "sweet" | "salty" | "both" | "neutral";

const OffersPage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [foodTypeFilter, setFoodTypeFilter] = useState<FoodTypeFilter>("all");
  const [tasteFilter, setTasteFilter] = useState<TasteFilter>("all");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceFilter, setDistanceFilter] = useState<number>(3); // Default 3km
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const backendOrigin = getBackendOrigin();

  // Get user's location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          // Handle geolocation errors gracefully
          // Code 1: PERMISSION_DENIED - user denied (expected)
          // Code 2: POSITION_UNAVAILABLE - unavailable (expected)
          // Code 3: TIMEOUT - timed out (expected)
          if (error.code === 2) {
            // Position unavailable - only log as debug, not error
            console.debug("Location unavailable:", error.message || "Position update is unavailable");
          } else if (error.code !== 1) {
            // Only log non-permission-denied errors
            console.log("Geolocation error:", error);
          }
          setLocationError(error.message);
          // Don't show error to user - distance sorting just won't be available
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000, // Cache for 5 minutes
        }
      );
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await axiosInstance.get(`/users/get-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(response.data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
        // Don't set error for role fetch failure - it's non-critical
      }
    };

    const fetchOffers = async () => {
      try {
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        // Use fetch instead of axios to avoid automatic cache-control headers
        const response = await fetch(`${backendOrigin}/offers?t=${timestamp}`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          // Don't use credentials: 'include' - we use Bearer tokens, not cookies
          // Using credentials with CORS requires specific origin, not wildcard
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Fetch ratings for all providers in parallel
        const providerIds = Array.from(new Set(data.map((o: any) => o.ownerId).filter(Boolean))) as number[];
        const ratingPromises = providerIds.map(async (providerId: number) => {
          try {
            const ratingResponse = await fetch(
              `${backendOrigin}/ratings/provider/${providerId}/average`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            if (ratingResponse.ok) {
              const ratingData = await ratingResponse.json();
              return { providerId, ...ratingData };
            }
          } catch (err) {
            // Silently fail - ratings are optional
            console.warn(`Failed to fetch rating for provider ${providerId}:`, err);
          }
          return { providerId, averageRating: 0, totalRatings: 0 };
        });

        const ratingsMap = new Map<number, { averageRating: number; totalRatings: number }>();
        const ratingsResults = await Promise.allSettled(ratingPromises);
        ratingsResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            ratingsMap.set(result.value.providerId, {
              averageRating: result.value.averageRating || 0,
              totalRatings: result.value.totalRatings || 0,
            });
          }
        });

        // normalize images array - preserve URLs from different backends, only normalize relative paths
        const backendOriginForImages = backendOrigin.replace(/\/$/, "");
        const mappedOffers: Offer[] = data.map((o: any) => {
          const rating = o.ownerId ? ratingsMap.get(o.ownerId) : null;
          const images = Array.isArray(o.images) ? o.images.map((img: any) => {
            if (!img) return img;
            
            // Normalize absoluteUrl - preserve URLs from different backends
            if (typeof img.absoluteUrl === "string") {
              // If it's a full URL, check if it's from a different backend
              if (/^https?:\/\//i.test(img.absoluteUrl)) {
                try {
                  const urlObj = new URL(img.absoluteUrl);
                  const urlHost = urlObj.hostname;
                  
                  // Extract current backend hostname
                  let currentBackendHost = "";
                  if (backendOriginForImages) {
                    try {
                      const backendUrlObj = new URL(backendOriginForImages);
                      currentBackendHost = backendUrlObj.hostname;
                    } catch {
                      const match = backendOriginForImages.match(/https?:\/\/([^\/]+)/);
                      if (match) currentBackendHost = match[1];
                    }
                  }
                  
                  // If URL is from a different backend, keep it as-is (don't normalize)
                  if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
                    return img; // Keep original URL from different backend
                  }
                  
                  // Same backend - normalize if needed
                  const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
                  }
                } catch {
                  // If URL parsing fails, try to normalize anyway (support both /store/ and /storage/)
                  const match = img.absoluteUrl.match(/\/(store\/.+)$/) || img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    const path = match[1].replace(/^storage\//, 'store/');
                    return { ...img, absoluteUrl: `${backendOrigin}/${path}` };
                  }
                }
              }
              // If it's a relative storage path, prepend current backend
              else if (img.absoluteUrl.startsWith("/store/") && backendOrigin) {
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
              } else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                // Legacy support: convert /storage/ to /store/
                const storePath = img.absoluteUrl.replace("/storage/", "/store/");
                return { ...img, absoluteUrl: `${backendOrigin}${storePath}` };
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
                // Fallback normalization
                const match = img.url.match(/\/(storage\/.+)$/);
                if (match && backendOrigin) {
                  return { ...img, url: `${backendOrigin}${match[1]}`, absoluteUrl: img.absoluteUrl || `${backendOrigin}${match[1]}` };
                }
              }
            }
            
            return img;
          }) : [];

          return { 
            ...o, 
            images,
            averageRating: rating?.averageRating,
            totalRatings: rating?.totalRatings,
          };
        });

        setOffers(mappedOffers);
      } catch (err: any) {
        console.error("Failed to fetch offers:", err);
        // Provide user-friendly error message
        if (err?.message?.includes("401") || err?.message?.includes("403")) {
          setError(t("offers.error_auth") || "Your session has expired. Please sign in again.");
          router.push("/signIn");
        } else {
          setError(t("offers.error_fetch") || "Unable to load offers. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchUserRole(), fetchOffers()]).catch((err) => {
      console.error("Error during data fetching:", err);
      setError(t("offers.error_generic") || "Unable to load offers. Please refresh the page.");
      setLoading(false);
    });
  }, [router, t]);

  // WEBSOCKET INTEGRATION TEMPORARILY DISABLED - Using manual refresh instead
  // Handle real-time offer updates
  // const handleOfferUpdate = useCallback((data: { type: string; offer: any }) => {
  //   const { type, offer } = data;
  //   console.log("🔄 handleOfferUpdate called with:", { type, offerId: offer?.id });
  //   
  //   if (!offer) {
  //     console.warn("⚠️ Received offer update without offer data");
  //     return;
  //   }
  //   
  //   // Normalize the offer data to match our format
  //   const normalizeOffer = (o: any): Offer => {
  //     const backendOrigin = getBackendOrigin();
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

  //   setOffers((prevOffers) => {
  //     console.log(`📊 Current offers count: ${prevOffers.length}`);
  //     if (type === 'created') {
  //       // Add new offer at the beginning
  //       const normalized = normalizeOffer(offer);
  //       console.log(`➕ Adding new offer: ${normalized.id} - ${normalized.title}`);
  //       const newOffers = [normalized, ...prevOffers];
  //       console.log(`📊 New offers count: ${newOffers.length}`);
  //       return newOffers;
  //     } else if (type === 'updated') {
  //       // Update existing offer
  //       const normalized = normalizeOffer(offer);
  //       console.log(`🔄 Updating offer: ${normalized.id}`);
  //       return prevOffers.map((o) => (o.id === offer.id ? normalized : o));
  //     } else if (type === 'deleted') {
  //       // Remove deleted offer
  //       console.log(`🗑️ Removing offer: ${offer.id}`);
  //       return prevOffers.filter((o) => o.id !== offer.id);
  //     }
  //     console.warn(`⚠️ Unknown offer update type: ${type}`);
  //     return prevOffers;
  //   });
  // }, []);

  // Connect to WebSocket for real-time updates
  // useWebSocket({
  //   onOfferUpdate: handleOfferUpdate,
  //   enabled: true,
  // });

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let result = [...offers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(offer =>
        offer.title.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query) ||
        (offer.owner?.location || offer.pickupLocation || "").toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filter === "available") {
      result = result.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0);
    } else if (filter === "low_stock") {
      result = result.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0 && o.quantity <= 5);
    }

    // Apply food type filter
    if (foodTypeFilter !== "all") {
      result = result.filter(o => o.foodType === foodTypeFilter);
    }

    // Apply taste filter
    if (tasteFilter !== "all") {
      result = result.filter(o => o.taste === tasteFilter);
    }

    // Apply distance filter if user location is available
    if (userLocation && distanceFilter) {
      result = result.filter(offer => {
        const offerLat = offer.latitude ?? offer.owner?.latitude ?? null;
        const offerLng = offer.longitude ?? offer.owner?.longitude ?? null;
        if (offerLat && offerLng) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            offerLat,
            offerLng
          );
          return distance <= distanceFilter;
        }
        return true; // Include offers without coordinates
      });
    }

    // Apply sorting
    const now = Date.now();
    switch (sort) {
      case "price_low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "earliest_pickup":
        // Sort by earliest pickup time (pickupStartTime), or expiration date if no pickup time
        result.sort((a, b) => {
          const aTime = a.pickupStartTime ? new Date(a.pickupStartTime).getTime() : new Date(a.expirationDate).getTime();
          const bTime = b.pickupStartTime ? new Date(b.pickupStartTime).getTime() : new Date(b.expirationDate).getTime();
          return aTime - bTime;
        });
        break;
      case "distance":
        if (userLocation) {
          result.sort((a, b) => {
            // Get coordinates from offer or owner
            const aLat = a.latitude ?? a.owner?.latitude ?? null;
            const aLng = a.longitude ?? a.owner?.longitude ?? null;
            const bLat = b.latitude ?? b.owner?.latitude ?? null;
            const bLng = b.longitude ?? b.owner?.longitude ?? null;

            // Calculate distances
            const aDistance = aLat && aLng
              ? calculateDistance(userLocation.lat, userLocation.lng, aLat, aLng)
              : Infinity;
            const bDistance = bLat && bLng
              ? calculateDistance(userLocation.lat, userLocation.lng, bLat, bLng)
              : Infinity;

            return aDistance - bDistance;
          });
        }
        // If no user location, fall through to newest
        break;
      case "newest":
      default:
        // Sort by creation/expiration date, newest first
        result.sort((a, b) => {
          const aExpired = isOfferExpired(a.expirationDate);
          const bExpired = isOfferExpired(b.expirationDate);
          if (aExpired !== bExpired) return aExpired ? 1 : -1;
          if (a.quantity === 0 && b.quantity !== 0) return 1;
          if (b.quantity === 0 && a.quantity !== 0) return -1;
          return new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime();
        });
        break;
    }

    return result;
  }, [offers, searchQuery, filter, sort, foodTypeFilter, tasteFilter, userLocation, distanceFilter]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-muted-foreground">{t("offers.loading")}</div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-destructive">{error}</div>
      </div>
    );

  // Skeleton loader component
  const OfferSkeleton = () => (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-border shadow-sm h-full">
      <Skeleton className="w-full h-48 sm:h-52" />
      <div className="flex flex-col flex-1 p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="p-4">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar - White (Too Good To Go style) */}
      {!loading && offers.length > 0 && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
          <input
            type="text"
            placeholder={t("offers.search_placeholder_extended") || "Bakery, restaurant, shop..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-14 py-3.5 sm:py-4 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-emerald-600/20 outline-none text-sm sm:text-base shadow-sm transition-all"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Filters Section - Collapsible */}
      {!loading && offers.length > 0 && showFilters && (
        <div className="space-y-4 bg-white border border-border rounded-2xl p-4 sm:p-5 shadow-sm">
          
          {/* Filters Section */}
          <div className="space-y-3">
            {/* Distance Filter */}
            {userLocation && (
              <div className="pb-3 border-b border-border">
                <label className="block text-xs font-medium text-foreground mb-2">
                  {t("offers.distance_filter") || "Maximum Distance"}
                </label>
                <div className="flex gap-2">
                  {[3, 5, 10, 20].map((distance) => (
                    <button
                      key={distance}
                      onClick={() => setDistanceFilter(distance)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        distanceFilter === distance
                          ? "bg-emerald-600 text-white shadow-md"
                          : "bg-white text-foreground hover:bg-emerald-50 border border-border"
                      }`}
                    >
                      {distance} km
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Status Filter - Button Group */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground min-w-[100px]">
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Status:</span>
              </div>
              <div className="flex flex-wrap gap-2 flex-1">
                {[
                  { value: "all", label: t("offers.filter_all") || "All Offers", icon: "✨" },
                  { value: "available", label: t("offers.filter_available") || "Available", icon: "✅" },
                  { value: "low_stock", label: t("offers.filter_low_stock") || "Low Stock", icon: "⚠️" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFilter(option.value as FilterType)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filter === option.value
                        ? "bg-emerald-600 text-white shadow-md scale-105"
                        : "bg-white text-foreground hover:bg-emerald-50 border border-border"
                    }`}
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                    {filter === option.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Category and Taste Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Food Type Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t("offers.filter_food_type") || "Food Type"}
                </label>
                <div className="relative">
                  <select
                    value={foodTypeFilter}
                    onChange={(e) => setFoodTypeFilter(e.target.value as FoodTypeFilter)}
                    className="w-full pl-4 pr-10 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm bg-white shadow-sm appearance-none cursor-pointer hover:border-emerald-600/50 transition-colors"
                  >
                    <option value="all">{t("offers.filter_all_types") || "All Types"}</option>
                    <option value="snack">🍪 {t("offers.food_type_snack") || "Snack"}</option>
                    <option value="meal">🍽️ {t("offers.food_type_meal") || "Meal"}</option>
                    <option value="beverage">🥤 {t("offers.food_type_beverage") || "Beverage"}</option>
                    <option value="other">📦 {t("offers.food_type_other") || "Other"}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Taste Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t("offers.filter_taste") || "Taste"}
                </label>
                <div className="relative">
                  <select
                    value={tasteFilter}
                    onChange={(e) => setTasteFilter(e.target.value as TasteFilter)}
                    className="w-full pl-4 pr-10 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm bg-white shadow-sm appearance-none cursor-pointer hover:border-emerald-600/50 transition-colors"
                  >
                    <option value="all">{t("offers.filter_all_tastes") || "All Tastes"}</option>
                    <option value="sweet">🍰 {t("offers.taste_sweet") || "Sweet"}</option>
                    <option value="salty">🧂 {t("offers.taste_salty") || "Salty"}</option>
                    <option value="both">🍬 {t("offers.taste_both") || "Both"}</option>
                    <option value="neutral">⚪ {t("offers.taste_neutral") || "Neutral"}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Sort Filter */}
              <div className="relative">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  {t("offers.sort_by") || "Sort by"}
                </label>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortType)}
                    className="w-full pl-4 pr-10 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm bg-white shadow-sm appearance-none cursor-pointer hover:border-emerald-600/50 transition-colors"
                  >
                    <option value="newest">{t("offers.sort_newest") || "Newest First"}</option>
                    <option value="price_low">{t("offers.sort_price_low") || "Price: Low to High"}</option>
                    <option value="price_high">{t("offers.sort_price_high") || "Price: High to Low"}</option>
                    <option value="earliest_pickup">{t("offers.sort_earliest_pickup") || "Earliest Pickup"}</option>
                    {userLocation && (
                      <option value="distance">{t("offers.sort_distance") || "Distance: Nearest First"}</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Active Filters Badges */}
            {(filter !== "all" || foodTypeFilter !== "all" || tasteFilter !== "all" || searchQuery) && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
                {filter !== "all" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                    <span>{filter === "available" ? "✅ Available" : "⚠️ Low Stock"}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilter("all");
                      }}
                      className="hover:bg-emerald-100 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {foodTypeFilter !== "all" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                    <span>{foodTypeFilter === "snack" ? "🍪" : foodTypeFilter === "meal" ? "🍽️" : foodTypeFilter === "beverage" ? "🥤" : "📦"} {t(`offers.food_type_${foodTypeFilter}`)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFoodTypeFilter("all");
                      }}
                      className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {tasteFilter !== "all" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium">
                    <span>{tasteFilter === "sweet" ? "🍰" : tasteFilter === "salty" ? "🧂" : tasteFilter === "both" ? "🍬" : "⚪"} {t(`offers.taste_${tasteFilter}`)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTasteFilter("all");
                      }}
                      className="hover:bg-amber-100 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {searchQuery && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 text-xs font-medium">
                    <span>🔍 &ldquo;{searchQuery}&rdquo;</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchQuery("");
                      }}
                      className="hover:bg-purple-100 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setFilter("all");
                    setFoodTypeFilter("all");
                    setTasteFilter("all");
                    setSearchQuery("");
                  }}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white border border-border rounded"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="text-sm text-muted-foreground px-1">
          {filteredAndSortedOffers.length === 0 ? (
            <span>{t("offers.no_results") || "No offers found"}</span>
          ) : (
            <span>
              {filteredAndSortedOffers.length} {filteredAndSortedOffers.length === 1 ? "offer" : "offers"} found
            </span>
          )}
        </div>
      )}

      {/* Offers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
          {[...Array(8)].map((_, i) => (
            <OfferSkeleton key={i} />
          ))}
        </div>
      ) : filteredAndSortedOffers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery || filter !== "all" || foodTypeFilter !== "all" || tasteFilter !== "all"
              ? t("offers.no_results") || "No offers match your search"
              : t("offers.no_offers_moment") || "No offers available at the moment"}
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {searchQuery || filter !== "all" || foodTypeFilter !== "all" || tasteFilter !== "all"
              ? t("offers.try_adjusting_filters") || "Try adjusting your search or filters to see more results."
              : t("offers.check_back_later") || "Check back later for new offers!"}
          </p>
          {(searchQuery || filter !== "all" || foodTypeFilter !== "all" || tasteFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setFilter("all");
                setFoodTypeFilter("all");
                setTasteFilter("all");
              }}
              className="mt-2"
            >
              {t("offers.clear_filters") || "Clear all filters"}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 items-stretch">
          {filteredAndSortedOffers.map((offer) => {
          const firstImage = offer.images?.[0];
          // Use the unified image resolution utility
          const imageSrc = resolveImageSource(firstImage);
          const imageAlt = firstImage?.alt ?? offer.title;

          // Use owner's current location if available, otherwise fallback to stored pickupLocation
          const currentLocation = offer.owner?.location || offer.pickupLocation;
          const currentMapsLink = offer.owner?.mapsLink || offer.mapsLink;

          return (
            <ClientOfferCard
              key={offer.id}
              offerId={offer.id}
              imageSrc={imageSrc}
              imageAlt={imageAlt}
              title={offer.title}
              description={offer.description}
              price={offer.price}
              originalPrice={offer.originalPrice}
              quantity={offer.quantity}
              expirationDate={offer.expirationDate}
              pickupStartTime={offer.pickupStartTime}
              pickupEndTime={offer.pickupEndTime}
              pickupLocation={currentLocation}
              mapsLink={currentMapsLink}
              reserveLink={`/client/offers/${offer.id}`}
              foodType={offer.foodType}
              taste={offer.taste}
              owner={offer.owner ? {
                id: offer.owner.id,
                username: offer.owner.username,
                location: offer.owner.location,
                mapsLink: offer.owner.mapsLink,
                profileImage: offer.owner.profileImage,
              } : undefined}
              averageRating={offer.averageRating}
              totalRatings={offer.totalRatings}
            />
          );
        })}
        </div>
      )}
    </div>
  );
};

export default OffersPage;
