"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import { ClientOfferCard } from "./offerCard";
import { useRouter } from "next/navigation";
import { resolveImageSource } from "@/utils/imageUtils";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useLanguage } from "@/context/LanguageContext";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isOfferExpired } from "./offerCard/utils";

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
  foodType?: "snack" | "meal" | "beverage" | "other";
  taste?: "sweet" | "salty" | "both" | "neutral";
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
  };
  user?: { username: string }; // Legacy field
}

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

type FilterType = "all" | "available" | "sold_out" | "expired";
type SortType = "newest" | "price_low" | "price_high" | "pickup_time";
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
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(response.data.role);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setError(t("offers.loading"));
      }
    };

    const fetchOffers = async () => {
      try {
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        // Use fetch instead of axios to avoid automatic cache-control headers
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers?t=${timestamp}`, {
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

        // normalize images array - preserve URLs from different backends, only normalize relative paths
        const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
        const mappedOffers: Offer[] = data.map((o: any) => {
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
                  if (backendOrigin) {
                    try {
                      const backendUrlObj = new URL(backendOrigin);
                      currentBackendHost = backendUrlObj.hostname;
                    } catch {
                      const match = backendOrigin.match(/https?:\/\/([^\/]+)/);
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
                  // If URL parsing fails, try to normalize anyway
                  const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
                  }
                }
              }
              // If it's a relative storage path, prepend current backend
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
                // Fallback normalization
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
      } catch (err) {
        console.error("Failed to fetch offers:", err);
        setError(t("offers.loading"));
      } finally {
        setLoading(false);
      }
    };

    Promise.all([fetchUserRole(), fetchOffers()]).catch((err) => {
      console.error("Error during data fetching:", err);
      setError(t("offers.error_generic"));
      setLoading(false);
    });
  }, [router, t]);

  // Handle real-time offer updates
  const handleOfferUpdate = useCallback((data: { type: string; offer: any }) => {
    const { type, offer } = data;
    console.log("🔄 handleOfferUpdate called with:", { type, offerId: offer?.id });
    
    if (!offer) {
      console.warn("⚠️ Received offer update without offer data");
      return;
    }
    
    // Normalize the offer data to match our format
    const normalizeOffer = (o: any): Offer => {
      const backendOrigin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
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
    };

    setOffers((prevOffers) => {
      console.log(`📊 Current offers count: ${prevOffers.length}`);
      if (type === 'created') {
        // Add new offer at the beginning
        const normalized = normalizeOffer(offer);
        console.log(`➕ Adding new offer: ${normalized.id} - ${normalized.title}`);
        const newOffers = [normalized, ...prevOffers];
        console.log(`📊 New offers count: ${newOffers.length}`);
        return newOffers;
      } else if (type === 'updated') {
        // Update existing offer
        const normalized = normalizeOffer(offer);
        console.log(`🔄 Updating offer: ${normalized.id}`);
        return prevOffers.map((o) => (o.id === offer.id ? normalized : o));
      } else if (type === 'deleted') {
        // Remove deleted offer
        console.log(`🗑️ Removing offer: ${offer.id}`);
        return prevOffers.filter((o) => o.id !== offer.id);
      }
      console.warn(`⚠️ Unknown offer update type: ${type}`);
      return prevOffers;
    });
  }, []);

  // Connect to WebSocket for real-time updates
  useWebSocket({
    onOfferUpdate: handleOfferUpdate,
    enabled: true,
  });

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
    } else if (filter === "sold_out") {
      result = result.filter(o => o.quantity === 0 && !isOfferExpired(o.expirationDate));
    } else if (filter === "expired") {
      result = result.filter(o => isOfferExpired(o.expirationDate));
    }

    // Apply food type filter
    if (foodTypeFilter !== "all") {
      result = result.filter(o => o.foodType === foodTypeFilter);
    }

    // Apply taste filter
    if (tasteFilter !== "all") {
      result = result.filter(o => o.taste === tasteFilter);
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
      case "pickup_time":
        result.sort((a, b) => {
          const aTime = a.pickupStartTime ? new Date(a.pickupStartTime).getTime() : new Date(a.expirationDate).getTime();
          const bTime = b.pickupStartTime ? new Date(b.pickupStartTime).getTime() : new Date(b.expirationDate).getTime();
          return aTime - bTime;
        });
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
  }, [offers, searchQuery, filter, sort, foodTypeFilter, tasteFilter]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">{t("offers.loading")}</div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );

  // Skeleton loader component
  const OfferSkeleton = () => (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full">
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
    <div className="space-y-6">
      {/* Search and Filter Section */}
      {!loading && offers.length > 0 && (
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t("offers.search_placeholder") || "Search offers..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
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
                <option value="all">{t("offers.filter_all") || "All Offers"}</option>
                <option value="available">{t("offers.filter_available") || "Available"}</option>
                <option value="sold_out">{t("offers.filter_sold_out") || "Sold Out"}</option>
                <option value="expired">{t("offers.filter_expired") || "Expired"}</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={foodTypeFilter}
              onChange={(e) => setFoodTypeFilter(e.target.value as FoodTypeFilter)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
            >
              <option value="all">{t("offers.filter_all_types") || "All Types"}</option>
              <option value="snack">🍪 {t("offers.food_type_snack") || "Snack"}</option>
              <option value="meal">🍽️ {t("offers.food_type_meal") || "Meal"}</option>
              <option value="beverage">🥤 {t("offers.food_type_beverage") || "Beverage"}</option>
              <option value="other">📦 {t("offers.food_type_other") || "Other"}</option>
            </select>

            {/* Taste Filter */}
            <select
              value={tasteFilter}
              onChange={(e) => setTasteFilter(e.target.value as TasteFilter)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
            >
              <option value="all">{t("offers.filter_all_tastes") || "All Tastes"}</option>
              <option value="sweet">🍰 {t("offers.taste_sweet") || "Sweet"}</option>
              <option value="salty">🧂 {t("offers.taste_salty") || "Salty"}</option>
              <option value="both">🍬 {t("offers.taste_both") || "Both"}</option>
              <option value="neutral">⚪ {t("offers.taste_neutral") || "Neutral"}</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
            >
              <option value="newest">{t("offers.sort_newest") || "Newest First"}</option>
              <option value="price_low">{t("offers.sort_price_low") || "Price: Low to High"}</option>
              <option value="price_high">{t("offers.sort_price_high") || "Price: High to Low"}</option>
              <option value="pickup_time">{t("offers.sort_pickup_time") || "Pickup Time"}</option>
            </select>
          </div>
        </div>
      )}

      {/* Results Count */}
      {!loading && (
        <div className="text-sm text-gray-600 px-1">
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
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchQuery || filter !== "all" || foodTypeFilter !== "all" || tasteFilter !== "all"
              ? t("offers.no_results") || "No offers match your search"
              : t("offers.no_offers_moment") || "No offers available at the moment"}
          </h3>
          <p className="text-gray-600 mb-4 max-w-md">
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
            />
          );
        })}
        </div>
      )}
    </div>
  );
};

export default OffersPage;
