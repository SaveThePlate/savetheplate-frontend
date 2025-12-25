"use client";

import React, { useEffect, useState, useRef } from "react";
import Offers from "@/components/Offers";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Search, MapPin, ChevronRight, X, Utensils, Croissant, ShoppingCart, Package, Clock, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { ClientOfferCard } from "@/components/offerCard/ClientOfferCard";
import { resolveImageSource } from "@/utils/imageUtils";
import { isOfferExpired } from "@/components/offerCard/utils";
import Link from "next/link";

interface LocationData {
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

interface Offer {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  expirationDate: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupLocation: string;
  mapsLink?: string;
  foodType?: "snack" | "meal" | "beverage" | "other";
  taste?: "sweet" | "salty" | "both" | "neutral";
  images?: { filename: string; alt?: string; url?: string; absoluteUrl?: string }[];
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
  };
  averageRating?: number;
  totalRatings?: number;
}

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [userId, setUserId] = useState<number | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();
  const isMountedRef = useRef(true);

  // Reverse geocoding function to get city and state from coordinates
  const reverseGeocode = React.useCallback(async (latitude: number, longitude: number): Promise<LocationData> => {
    try {
      const token = localStorage.getItem("accessToken");
      const headers: any = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/reverse-geocode?lat=${latitude}&lon=${longitude}`,
        { headers }
      );
      
      return {
        city: response.data.city || 'Unknown',
        state: response.data.state || 'Unknown',
        latitude,
        longitude,
      };
    } catch (error: any) {
      console.error("Reverse geocoding error:", error);
      // Return Unknown instead of lat/lng so it doesn't display coordinates
      return {
        city: 'Unknown',
        state: 'Unknown',
        latitude,
        longitude,
      };
    }
  }, []);

  // Request user location
  const requestLocation = React.useCallback(async () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser");
      return;
    }

    // Check if location was previously unavailable to avoid repeated requests
    // This prevents triggering CoreLocation framework errors on iOS
    const locationUnavailable = localStorage.getItem('locationUnavailable');
    if (locationUnavailable === 'true') {
      // Location was previously unavailable, skip request to reduce console noise
      // and prevent CoreLocation framework errors on iOS
      setLocationPermission('denied');
      setIsLoadingLocation(false);
      return;
    }

    // Also check if we have a cached location that's still valid
    const cachedLocation = localStorage.getItem('userLocation');
    if (cachedLocation) {
      try {
        const location = JSON.parse(cachedLocation);
        // Use cached location if it's less than 24 hours old
        const cacheAge = Date.now() - (location.timestamp || 0);
        if (cacheAge < 24 * 60 * 60 * 1000) {
          setLocationData(location);
          setLocationPermission('granted');
          setIsLoadingLocation(false);
          return;
        }
      } catch (e) {
        // Invalid cache, continue with new request
      }
    }
    setIsLoadingLocation(true);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        setIsLoadingLocation(false);
        setLocationPermission('denied');
        console.warn("Location request timed out");
      }
    }, 15000); // 15 second timeout

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        try {
          const { latitude, longitude } = position.coords;
          const location = await reverseGeocode(latitude, longitude);
          
          if (isMountedRef.current) {
            // Only save if we got a valid location (not Unknown)
            if (location.city !== 'Unknown' && location.state !== 'Unknown') {
              // Add timestamp for cache validation
              const locationWithTimestamp = { ...location, timestamp: Date.now() };
              setLocationData(location);
              setLocationPermission('granted');
              localStorage.setItem('userLocation', JSON.stringify(locationWithTimestamp));
              // Clear the unavailable flag if location was successfully obtained
              localStorage.removeItem('locationUnavailable');
            } else {
              // If geocoding failed, don't save Unknown location
              setLocationPermission('denied');
            }
          }
        } catch (error) {
          console.error("Error getting location:", error);
          if (isMountedRef.current) {
            setLocationPermission('denied');
          }
        } finally {
          if (isMountedRef.current) {
            setIsLoadingLocation(false);
          }
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        
        // Handle different error codes gracefully
        // Code 1: PERMISSION_DENIED - user denied location access (expected)
        // Code 2: POSITION_UNAVAILABLE - location unavailable (expected)
        // Code 3: TIMEOUT - request timed out (expected)
        if (error.code === 1) {
          // Permission denied - user chose not to share location (expected behavior)
          // Don't log as error, just set permission state
        } else if (error.code === 2) {
          // Position unavailable - location services unavailable (expected on some devices)
          // Log as debug only (won't show in production console unless verbose mode)
          console.debug("Location unavailable:", error.message || "Position update is unavailable");
          // Remember that location is unavailable to avoid repeated requests
          localStorage.setItem('locationUnavailable', 'true');
        } else if (error.code === 3) {
          // Timeout - request took too long (expected)
          console.warn("Location request timed out");
        } else {
          // Unknown error - log as error
          console.error("Unexpected geolocation error:", error);
        }
        
        if (isMountedRef.current) {
          setIsLoadingLocation(false);
          setLocationPermission('denied');
        }
      },
      {
        enableHighAccuracy: false, // Changed to false for faster response
        timeout: 8000, // Reduced timeout to 8 seconds
        maximumAge: 600000, // Accept cached location up to 10 minutes old
      }
    );
  }, [reverseGeocode]);

  useEffect(() => {
    isMountedRef.current = true;
    // Load saved location from localStorage on mount
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsed = JSON.parse(savedLocation);
        // Check if saved location is in lat/lng format (needs re-geocoding)
        if (parsed.city && parsed.city.startsWith('Lat:') || parsed.state && parsed.state.startsWith('Lng:')) {
          // If we have valid coordinates, re-geocode them
          if (parsed.latitude && parsed.longitude) {
            requestLocation();
          } else {
            // Invalid saved data, clear it and request new location
            localStorage.removeItem('userLocation');
            if (navigator.geolocation) {
              requestLocation();
            }
          }
        } else {
          // Valid saved location
          setLocationData(parsed);
          setLocationPermission('granted');
        }
      } catch (e) {
        // Invalid saved data, ignore and request new location
        localStorage.removeItem('userLocation');
        if (navigator.geolocation) {
          requestLocation();
        }
      }
    } else {
      // Try to get location on mount if not saved
      if (navigator.geolocation) {
        requestLocation();
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [requestLocation]);

  // Fetch offers function
  const fetchOffers = React.useCallback(async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      let currentUserId: string | undefined;
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        currentUserId = tokenPayload?.id;
        if (isMountedRef.current) {
          setUserId(Number(currentUserId));
        }
      } catch (error) {
        console.error("Error parsing token:", error);
        try {
          const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers });
          currentUserId = userResponse.data?.id;
          if (isMountedRef.current) {
            setUserId(Number(currentUserId));
          }
        } catch (apiError) {
          console.error("Error fetching user info:", apiError);
        }
      }

      const timestamp = Date.now();

      const [offersResponse, ordersResponse] = await Promise.allSettled([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers?t=${timestamp}`, {
          method: 'GET',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
        }).then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        }),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${currentUserId}?t=${timestamp}`, { headers }),
      ]);

      if (!isMountedRef.current) return;

      if (offersResponse.status === "fulfilled") {
        const offersData = offersResponse.value;
        setOffers(offersData);
        setError(null);
      } else {
        console.error("Failed to fetch offers:", offersResponse.reason);
        if (isMountedRef.current) {
          const errorMsg = sanitizeErrorMessage(offersResponse.reason, {
            action: "load offers",
            defaultMessage: t("client.home.fetch_offers_failed") || "Unable to load offers. Please try again later."
          });
          setError(errorMsg);
        }
      }

      if (ordersResponse.status === "fulfilled") {
        const pending = (ordersResponse.value.data || []).filter(
          (o: any) => o.status === "pending"
        ).length;
        if (isMountedRef.current) {
          setPendingCount(pending);
        }
      } else {
        console.debug("Could not fetch pending orders", ordersResponse.reason);
      }
    } catch (fetchError) {
      console.error("Failed to fetch data:", fetchError);
      if (isMountedRef.current) {
        const errorMsg = sanitizeErrorMessage(fetchError, {
          action: "load offers",
          defaultMessage: "Unable to load offers. Please check your connection and try again."
        });
        setError(errorMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [router, t]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Filter products by search query
  const searchFilteredProducts = searchQuery.trim()
    ? offers.filter(p => {
        const query = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.owner?.location || p.pickupLocation || "").toLowerCase().includes(query) ||
          (p.foodType && p.foodType.toLowerCase().includes(query))
        );
      })
    : null;

  const featuredProducts = offers.filter(p => !isOfferExpired(p.expirationDate) && p.quantity > 0).slice(0, 5);

  // Category definitions with icons and foodType mapping - matching the rest of the app
  const categories = [
    {
      name: t('offers.food_type_meal') || "Meals",
      foodType: 'meal',
      icon: Utensils,
      color: 'bg-orange-100 text-orange-600',
      count: offers.filter(p => p.foodType === 'meal' && !isOfferExpired(p.expirationDate) && p.quantity > 0).length,
    },
    {
      name: t('offers.food_type_snack') || "Snacks",
      foodType: 'snack',
      icon: Croissant,
      color: 'bg-yellow-100 text-yellow-600',
      count: offers.filter(p => p.foodType === 'snack' && !isOfferExpired(p.expirationDate) && p.quantity > 0).length,
    },
    {
      name: t('offers.food_type_beverage') || "Beverages",
      foodType: 'beverage',
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-600',
      count: offers.filter(p => p.foodType === 'beverage' && !isOfferExpired(p.expirationDate) && p.quantity > 0).length,
    },
    {
      name: t('offers.food_type_other') || "Other",
      foodType: 'other',
      icon: Package,
      color: 'bg-emerald-100 text-emerald-600',
      count: offers.filter(p => p.foodType === 'other' && !isOfferExpired(p.expirationDate) && p.quantity > 0).length,
    },
  ];

  // Filter products by selected category
  const categoryFilteredProducts = selectedCategory
    ? offers.filter(p => p.foodType === selectedCategory && !isOfferExpired(p.expirationDate) && p.quantity > 0)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <div className="p-4 space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-1/3"></div>
          <div className="h-40 bg-muted rounded-2xl w-full"></div>
          <div className="space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="flex gap-4 overflow-hidden">
              <div className="h-64 bg-muted rounded-2xl w-64 flex-shrink-0"></div>
              <div className="h-64 bg-muted rounded-2xl w-64 flex-shrink-0"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-transparent backdrop-blur-md border-b border-border/50 px-4 py-4">
        {locationData && (
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={requestLocation}
              disabled={isLoadingLocation}
              className="flex items-center gap-2 text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 active:scale-95"
              title={locationPermission === 'granted' ? 'Update location' : 'Tap to enable location'}
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="w-5 h-5 fill-current animate-spin" />
                  <span className="font-bold text-foreground">{t("common.loading")}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 fill-current" />
                  <span className="font-bold text-foreground">
                    {locationData.city !== 'Unknown' && locationData.state !== 'Unknown' 
                      ? `${locationData.city}, ${locationData.state}`
                      : t("home.getLocation") || "Get Location"}
                  </span>
                  {locationData.city !== 'Unknown' && locationData.state !== 'Unknown' && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </>
              )}
            </button>
          </div>
        )}
        {!locationData && (
          <div className="mb-4">
            <button
              onClick={requestLocation}
              disabled={isLoadingLocation}
              className="flex items-center gap-2 text-emerald-600 cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 active:scale-95"
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="w-5 h-5 fill-current animate-spin" />
                  <span className="font-bold text-foreground">{t("common.loading")}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5 fill-current" />
                  <span className="font-bold text-foreground">{t("home.getLocation") || "Get Location"}</span>
                </>
              )}
            </button>
          </div>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("home.searchPlaceholder") || "Search for food, stores..."} 
            className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border-none focus:ring-2 focus:ring-emerald-600/20 focus:outline-none transition-all placeholder:text-muted-foreground text-sm font-medium shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-white shadow-sm border border-border hover:bg-gray-50"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
          )}
        </div>
      </header>

      {/* Pickup Reminder Banner */}
      {pendingCount > 0 && (
        <div className="px-4 pt-4">
          <Link
            href={userId ? `/client/orders/${userId}` : "/client/orders"}
            className="block bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-amber-700" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-amber-900 mb-1">
                  {t("client.home.pickup_reminder_title") || "Don't forget to pick up your order!"}
                </h3>
                <p className="text-sm text-amber-800 mb-3">
                  {pendingCount === 1
                    ? t("client.home.pickup_reminder_message_singular") || "You have 1 pending order waiting for pickup."
                    : t("client.home.pickup_reminder_message", { count: pendingCount, plural: "s" }) || `You have ${pendingCount} pending orders waiting for pickup.`}
                </p>
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                  <span>{t("client.home.view_orders") || "View Orders"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      <main className="space-y-8 pt-6">
        {/* Search Results */}
        {searchQuery.trim() && (
          <section className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-xl">
                Search Results {searchFilteredProducts && `(${searchFilteredProducts.length})`}
              </h3>
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("common.clear")}
              </button>
            </div>
            {searchFilteredProducts && searchFilteredProducts.length > 0 ? (
              <div className="space-y-4">
                {searchFilteredProducts.map((offer) => {
                  const firstImage = offer.images?.[0];
                  const imageSrc = resolveImageSource(firstImage);
                  return (
                    <ClientOfferCard
                      key={offer.id}
                      offerId={offer.id}
                      imageSrc={imageSrc}
                      imageAlt={firstImage?.alt ?? offer.title}
                      title={offer.title}
                      description={offer.description}
                      price={offer.price}
                      originalPrice={offer.originalPrice}
                      quantity={offer.quantity}
                      expirationDate={offer.expirationDate}
                      pickupStartTime={offer.pickupStartTime}
                      pickupEndTime={offer.pickupEndTime}
                      pickupLocation={offer.owner?.location || offer.pickupLocation}
                      mapsLink={offer.owner?.mapsLink || offer.mapsLink}
                      reserveLink={`/client/offers/${offer.id}`}
                      foodType={offer.foodType}
                      taste={offer.taste}
                      owner={offer.owner}
                      averageRating={offer.averageRating}
                      totalRatings={offer.totalRatings}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 text-center border border-border border-dashed">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t("common.search")}: &quot;{searchQuery}&quot;</p>
              </div>
            )}
          </section>
        )}

        {/* Hero Section - Hide when searching */}
        {!searchQuery.trim() && (
          <section className="px-4">
            <div 
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl p-6 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-10 -mb-10 pointer-events-none"></div>
              
              <div className="relative z-10">
                <h2 className="text-2xl font-display font-bold mb-2">{t("home.title") || "Save food, Save money"}</h2>
                <p className="text-white/90 text-sm mb-6 max-w-[80%]">{t("home.subtitle") || "Help the planet by rescuing delicious unsold food from local shops."}</p>
                <Link href="/client/home" className="inline-block bg-white text-emerald-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:shadow-lg hover:scale-105 transition-all active:scale-95">
                  {t("home.browseBags") || "Discover Exclusive Offers"}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Recommended - Grid on large screens, scroll on mobile */}
        {!searchQuery.trim() && featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between px-4 mb-4">
              <h3 className="font-display font-bold text-xl">{t("home.recommended") || "Recommended for you"}</h3>
              <Link href="/client/home" className="text-emerald-600 text-sm font-semibold hover:underline">{t("home.seeAll") || "See all"}</Link>
        </div>

            <div className="flex lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-x-auto lg:overflow-x-visible px-4 pb-4 hide-scrollbar snap-x snap-mandatory lg:snap-none">
              {featuredProducts.map((offer) => {
                const firstImage = offer.images?.[0];
                const imageSrc = resolveImageSource(firstImage);
                return (
                  <div key={offer.id} className="w-[280px] lg:w-full flex-shrink-0 lg:flex-shrink snap-center">
                    <ClientOfferCard
                      offerId={offer.id}
                      imageSrc={imageSrc}
                      imageAlt={firstImage?.alt ?? offer.title}
                      title={offer.title}
                      description={offer.description}
                      price={offer.price}
                      originalPrice={offer.originalPrice}
                      quantity={offer.quantity}
                      expirationDate={offer.expirationDate}
                      pickupStartTime={offer.pickupStartTime}
                      pickupEndTime={offer.pickupEndTime}
                      pickupLocation={offer.owner?.location || offer.pickupLocation}
                      mapsLink={offer.owner?.mapsLink || offer.mapsLink}
                      reserveLink={`/client/offers/${offer.id}`}
                      foodType={offer.foodType}
                      taste={offer.taste}
                      owner={offer.owner}
                      averageRating={offer.averageRating}
                      totalRatings={offer.totalRatings}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Categories - Hide when searching */}
        {!searchQuery.trim() && (
          <section className="px-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-xl">{t("home.categories") || "Categories"}</h3>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-emerald-600 font-medium hover:underline flex items-center gap-1"
                >
                  <X size={14} />
                  {t("home.clearFilter") || "Clear filter"}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.foodType;
                return (
                  <div 
                    key={category.foodType}
                    onClick={() => setSelectedCategory(isSelected ? null : category.foodType)}
                    className={`bg-white border rounded-xl p-4 flex items-center justify-between shadow-sm cursor-pointer transition-all active:scale-[0.98] group ${
                      isSelected 
                        ? 'border-emerald-600 bg-emerald-50' 
                        : 'border-border/50 hover:border-emerald-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${category.color} ${isSelected ? 'ring-2 ring-emerald-600 ring-offset-2' : ''}`}>
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-semibold text-sm block truncate ${isSelected ? 'text-emerald-600' : ''}`}>{category.name}</span>
                        <span className="text-xs text-muted-foreground">{category.count} available</span>
                      </div>
                    </div>
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                        <X size={12} className="text-white" />
                      </div>
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground group-hover:text-emerald-600 transition-colors flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Filtered Products by Category - Hide when searching */}
        {!searchQuery.trim() && selectedCategory && categoryFilteredProducts && (
          <section className="px-4">
            <h3 className="font-display font-bold text-xl mb-4">
              {categories.find(c => c.foodType === selectedCategory)?.name}
            </h3>
            {categoryFilteredProducts.length > 0 ? (
              <div className="space-y-4">
                {categoryFilteredProducts.map((offer) => {
                  const firstImage = offer.images?.[0];
                  const imageSrc = resolveImageSource(firstImage);
                  return (
                    <ClientOfferCard
                      key={offer.id}
                      offerId={offer.id}
                      imageSrc={imageSrc}
                      imageAlt={firstImage?.alt ?? offer.title}
                      title={offer.title}
                      description={offer.description}
                      price={offer.price}
                      originalPrice={offer.originalPrice}
                      quantity={offer.quantity}
                      expirationDate={offer.expirationDate}
                      pickupStartTime={offer.pickupStartTime}
                      pickupEndTime={offer.pickupEndTime}
                      pickupLocation={offer.owner?.location || offer.pickupLocation}
                      mapsLink={offer.owner?.mapsLink || offer.mapsLink}
                      reserveLink={`/client/offers/${offer.id}`}
                      foodType={offer.foodType}
                      taste={offer.taste}
                      owner={offer.owner}
                      averageRating={offer.averageRating}
                      totalRatings={offer.totalRatings}
                    />
                  );
                })}
            </div>
          ) : (
              <div className="bg-white rounded-xl p-8 text-center border border-border border-dashed">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">{t("home.noProductsInCategory") || "No products available in this category"}</p>
              </div>
            )}
          </section>
        )}

        {/* All Offers - Only show when not searching and no category selected */}
        {!searchQuery.trim() && !selectedCategory && (
          <section className="px-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-xl">{t("offers.available_offers") || "Available Offers"}</h3>
            </div>
            <Offers />
          </section>
        )}
      </main>
      </div>
  );
};

export default Home;
