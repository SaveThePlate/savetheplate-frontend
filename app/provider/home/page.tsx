"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { getBackendOrigin } from "@/lib/backendOrigin";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Plus, Search, Edit2, Trash2, Package, Clock, MapPin, X, AlertCircle } from "lucide-react";
import { resolveImageSource } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";
import { isOfferExpired } from "@/components/offerCard/utils";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { sanitizeImageUrl, shouldUnoptimizeImage } from "@/utils/imageUtils";
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaFooter,
} from "@/components/ui/credenza";
import { ProviderOfferCard } from "@/components/offerCard";
import { OfferTypeModal } from "@/components/OfferTypeModal";
import { useUser } from "@/context/UserContext";

type FoodType = "snack" | "meal" | "beverage" | "other";
type Taste = "sweet" | "salty" | "both" | "neutral";

interface Offer {
  price: number;
  originalPrice?: number;
  quantity: number;
  id: number;
  ownerId: number;
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

type FilterType = "all" | "active" | "expired";

const ProviderHome = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { userRole } = useUser();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingOfferId, setEditingOfferId] = useState<number | null>(null);
  const [showOfferTypeModal, setShowOfferTypeModal] = useState(false);
  const isMountedRef = useRef(true);
  const isPendingProvider = userRole === "PENDING_PROVIDER";

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
        const backendOrigin = getBackendOrigin();
        
        // Parse userId from token - no need for API call
        let id: string | number | undefined;
        try {
          const tokenPayload = JSON.parse(atob(token.split(".")[1]));
          id = tokenPayload?.id;
        } catch (error) {
          console.error("Error parsing token:", error);
          router.push("/signIn");
          return;
        }

        if (!id) {
          console.error("Could not determine user ID");
          router.push("/signIn");
          return;
        }

        const response = await axiosInstance.get(
          `/offers/owner/${id}`,
          { 
            headers,
            timeout: 8000, // 8 second timeout
          }
        );

        if (!isMountedRef.current) return;

        // Ensure response.data is an array
        const offersArray = Array.isArray(response.data) ? response.data : [];
        
        const backendOriginForImages = backendOrigin.replace(/\/$/, "");
        const mappedOffers: Offer[] = offersArray.map((o: any) => {
          const images = Array.isArray(o.images) ? o.images.map((img: any) => {
            if (!img) return img;
            
            if (typeof img.absoluteUrl === "string") {
              if (/^https?:\/\//i.test(img.absoluteUrl)) {
                try {
                  const urlObj = new URL(img.absoluteUrl);
                  const urlHost = urlObj.hostname;
                  
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
                  
                  if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
                    return img;
                  }
                  
                  const match = img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    return { ...img, absoluteUrl: `${backendOrigin}${match[1]}` };
                  }
                } catch {
                  // Support both /store/ and /storage/ for backward compatibility
                  const match = img.absoluteUrl.match(/\/(store\/.+)$/) || img.absoluteUrl.match(/\/(storage\/.+)$/);
                  if (match && backendOrigin) {
                    const path = match[1].replace(/^storage\//, 'store/');
                    return { ...img, absoluteUrl: `${backendOrigin}/${path}` };
                  }
                }
              }
              else if (img.absoluteUrl.startsWith("/store/") && backendOrigin) {
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
              } else if (img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                // Legacy support: convert /storage/ to /store/
                const storePath = img.absoluteUrl.replace("/storage/", "/store/");
                return { ...img, absoluteUrl: `${backendOrigin}${storePath}` };
                return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
              }
            }
            
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
                
                if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
                  return { ...img, absoluteUrl: img.absoluteUrl || img.url };
                }
                
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

  const handleDeleteOffer = async (id: number) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    setDeleteConfirmId(null);
    
    // Add to deleting set for loading state
    setDeletingIds(prev => new Set(prev).add(id));
    
    // Store the offer to restore if delete fails
    const offerToDelete = offers.find(o => o.id === id);
    
    // Store current scroll position
    const scrollY = window.scrollY;

    try {
      const response = await axiosInstance.delete(`/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // 10 second timeout
      });
      
      // Success - remove from UI and restore scroll position
      if (isMountedRef.current) {
        // Use setTimeout to ensure smooth transition
        setTimeout(() => {
          setOffers(prev => prev.filter(o => o.id !== id));
          
          // Restore scroll position after DOM update
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        }, 300); // Wait for the card animation to complete
        
        toast.success(t("provider.home.offer_deleted") || "Offer deleted successfully");
      }
      
    } catch (err: any) {
      // Only restore if component is still mounted and it's a genuine error
      if (!isMountedRef.current) return;
      
      const status = err?.response?.status;
      const statusText = err?.response?.statusText;
      
      // If it's actually a success response (200-299), don't restore
      if (status >= 200 && status < 300) {
        setTimeout(() => {
          setOffers(prev => prev.filter(o => o.id !== id));
          
          // Restore scroll position after DOM update
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollY);
          });
        }, 300);
        
        toast.success(t("provider.home.offer_deleted") || "Offer deleted successfully");
        return;
      }
      
      // Delete failed - show error but don't restore since we didn't remove it
      const errorMsg = sanitizeErrorMessage(err, {
        action: "delete offer",
        defaultMessage: t("provider.home.delete_failed") || "Unable to delete offer. Please try again."
      });
      
      // Show user-friendly error message
      toast.error(errorMsg);
      console.error("Failed to delete offer:", { error: err, status, statusText });
      
    } finally {
      // Remove from deleting set
      if (isMountedRef.current) {
        setTimeout(() => {
          setDeletingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });
        }, 300);
      }
    }
  };

  const stats = useMemo(() => {
    const active = offers.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0).length;
    const expired = offers.filter(o => isOfferExpired(o.expirationDate)).length;
    
    return {
      total: offers.length,
      active,
      expired,
    };
  }, [offers]);

  const filteredAndSortedOffers = useMemo(() => {
    let result = [...offers].sort((a, b) => {
      const aExpired = isOfferExpired(a.expirationDate);
      const bExpired = isOfferExpired(b.expirationDate);
      if (aExpired !== bExpired) return aExpired ? 1 : -1;
      return new Date(b.expirationDate).getTime() - new Date(a.expirationDate).getTime();
    });

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(offer =>
        offer.title.toLowerCase().includes(query) ||
        offer.description.toLowerCase().includes(query) ||
        offer.pickupLocation.toLowerCase().includes(query)
      );
    }

    if (filter === "active") {
      result = result.filter(o => !isOfferExpired(o.expirationDate) && o.quantity > 0);
    } else if (filter === "expired") {
      result = result.filter(o => isOfferExpired(o.expirationDate));
    }

    return result;
  }, [offers, searchQuery, filter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t("common.today") || "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t("common.tomorrow") || "Tomorrow";
    }
    return date.toLocaleDateString();
  };

  return (
    <main className="min-h-screen pb-24 px-4 pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Pending Provider Banner */}
        {isPendingProvider && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                {t("provider.home.pending_title") || "Account Under Review"}
              </h3>
              {/* <p className="text-sm text-amber-800">
                {t("provider.home.pending_message") || "Your provider account is currently under review. You can create and manage offers, but they will only be visible to customers once your account is approved by our team."}
              </p> */}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl mb-1">
              {t("provider.home.title") || "My Offers"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {stats.active} {t("provider.home.stats.active") || "active"} {stats.total > 0 && `• ${stats.total} ${t("provider.home.stats.total") || "total"}`}
            </p>
          </div>
          <Button
            onClick={() => setShowOfferTypeModal(true)}
            size="lg"
            className="w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("provider.home.create_offer") || "Create Offer"}
          </Button>
        </div>

        {/* Search and Filters */}
        {!loading && offers.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder={t("provider.home.search_placeholder") || "Search offers..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                {t("provider.home.stats.total") || "All"}
              </Button>
              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("active")}
              >
                {t("provider.home.stats.active") || "Active"}
              </Button>
              <Button
                variant={filter === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("expired")}
              >
                {t("provider.home.stats.expired") || "Expired"}
              </Button>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground text-sm">{t("provider.home.loading_offers") || "Loading offers..."}</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 text-center">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        ) : offers.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl border border-border shadow-sm p-12 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {t("provider.home.empty_state_title") || "No offers yet"}
              </h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {t("provider.home.empty_state_description") || "Create your first offer to start selling surplus food"}
              </p>
              <Button
                onClick={() => setShowOfferTypeModal(true)}
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("provider.home.create_offer") || "Create Offer"}
              </Button>
            </div>
          </div>
        ) : filteredAndSortedOffers.length === 0 ? (
          <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
            <p className="text-muted-foreground">
              {t("provider.home.no_results") || "No offers match your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedOffers.map((offer) => {
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
              const imageSrc = resolveImageSource(firstImage);
              const expired = isOfferExpired(offer.expirationDate);
              const currentLocation = (offer.pickupLocation && offer.pickupLocation.trim() !== '') ? offer.pickupLocation : (offer.owner?.location || offer.pickupLocation);

              return (
                <div
                  key={offer.id}
                  className={`bg-white rounded-xl border border-border shadow-sm hover:shadow-md transition-all overflow-hidden ${
                    expired ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    {/* Image */}
                    <div className="relative w-full sm:w-32 h-32 sm:h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {imageSrc ? (
                        <Image
                          src={sanitizeImageUrl(imageSrc)}
                          alt={offer.title}
                          fill
                          className="object-cover"
                          unoptimized={shouldUnoptimizeImage(imageSrc)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                      {expired && (
                        <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full">
                          {t("common.expired") || "Expired"}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1 line-clamp-1">{offer.title}</h3>
                          {offer.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{offer.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-4 h-4" />
                              <span>{offer.quantity} {offer.quantity === 1 ? (t("common.item") || "item") : (t("common.items") || "items")}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(offer.expirationDate)}</span>
                            </div>
                            {currentLocation && (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                <span className="truncate max-w-[150px]">{currentLocation}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price and Actions */}
                        <div className="flex flex-col sm:items-end gap-3">
                          <div className="text-right">
                            {offer.originalPrice && offer.originalPrice > offer.price ? (
                              <div>
                                <span className="text-sm text-muted-foreground line-through mr-2">
                                  {offer.originalPrice.toFixed(2)} dt
                                </span>
                                <span className="text-xl font-bold text-primary">
                                  {offer.price.toFixed(2)} dt
                                </span>
                              </div>
                            ) : (
                              <span className="text-xl font-bold text-primary">
                                {offer.price.toFixed(2)} dt
                              </span>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {/* Hidden ProviderOfferCard for edit functionality */}
                            <div className="hidden" data-offer-edit-wrapper={offer.id}>
                              <ProviderOfferCard
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
                                mapsLink={offer.mapsLink}
                                foodType={offer.foodType}
                                taste={offer.taste}
                                ownerId={offer.ownerId}
                                isDeleting={deletingIds.has(offer.id)}
                                onDelete={handleDeleteOffer}
                                onUpdate={async (id, data) => {
                                  const backendOrigin = getBackendOrigin();
                                  const normalizeImages = (images: any) => {
                                    if (!Array.isArray(images)) return [];
                                    return images.map((img: any) => {
                                      if (!img) return img;
                                      if (typeof img.absoluteUrl === "string" && img.absoluteUrl.startsWith("/store/") && backendOrigin) {
                                        return { ...img, absoluteUrl: `${backendOrigin}${img.absoluteUrl}` };
                                      }
                                      if (typeof img.absoluteUrl === "string" && img.absoluteUrl.startsWith("/storage/") && backendOrigin) {
                                        // Legacy support: convert /storage/ to /store/
                                        const storePath = img.absoluteUrl.replace("/storage/", "/store/");
                                        return { ...img, absoluteUrl: `${backendOrigin}${storePath}` };
                                      }
                                      if (typeof img.url === "string" && img.url.startsWith("/store/") && backendOrigin) {
                                        return { ...img, url: `${backendOrigin}${img.url}` };
                                      }
                                      if (typeof img.url === "string" && img.url.startsWith("/storage/") && backendOrigin) {
                                        // Legacy support: convert /storage/ to /store/
                                        const storePath = img.url.replace("/storage/", "/store/");
                                        return { ...img, url: `${backendOrigin}${storePath}` };
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
                                  
                                  try {
                                    const token = localStorage.getItem("accessToken");
                                    if (!token) return;
                                    
                                    const response = await axiosInstance.get(
                                      `/offers/${id}`,
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
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const wrapper = document.querySelector(`[data-offer-edit-wrapper="${offer.id}"]`);
                                const editButton = wrapper?.querySelector('button') as HTMLElement;
                                if (editButton) {
                                  editButton.click();
                                }
                              }}
                              className="flex-1 sm:flex-none"
                            >
                              <Edit2 className="w-4 h-4 mr-1.5" />
                              {t("common.edit") || "Edit"}
                            </Button>
                            <Credenza open={deleteConfirmId === offer.id} onOpenChange={(open) => setDeleteConfirmId(open ? offer.id : null)}>
                              <CredenzaTrigger asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Trash2 className="w-4 h-4 mr-1.5" />
                                  {t("common.delete") || "Delete"}
                                </Button>
                              </CredenzaTrigger>
                              <CredenzaContent>
                                <CredenzaHeader>
                                  <CredenzaTitle>{t("offer_card.confirm_deletion") || "Confirm Deletion"}</CredenzaTitle>
                                  <CredenzaDescription>
                                    {t("offer_card.delete_message") || "Are you sure you want to delete this offer? This action cannot be undone."}
                                  </CredenzaDescription>
                                </CredenzaHeader>
                                <CredenzaFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirmId(null)}
                                  >
                                    {t("common.cancel") || "Cancel"}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleDeleteOffer(offer.id)}
                                  >
                                    {t("common.delete") || "Delete"}
                                  </Button>
                                </CredenzaFooter>
                              </CredenzaContent>
                            </Credenza>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Offer Type Modal */}
      <OfferTypeModal 
        isOpen={showOfferTypeModal}
        onClose={() => setShowOfferTypeModal(false)}
      />
    </main>
  );
};

export default ProviderHome;
