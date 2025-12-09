"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProviderOfferCard } from "@/components/offerCard";
import { useRouter } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { resolveImageSource } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";
import { useWebSocket } from "@/hooks/useWebSocket";

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

const ProviderHome = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const id = tokenPayload.id;

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
      } catch (err) {
        if (isMountedRef.current) {
          setError(t("provider.home.fetch_offers_failed", { error: (err as Error).message }));
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
    
    const tokenPayload = JSON.parse(atob(token.split(".")[1]));
    const currentUserId = tokenPayload.id;
    
    // Only process offers that belong to this provider
    if (offer.ownerId !== currentUserId) {
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
      toast.error(err?.response?.data?.message || t("provider.home.delete_failed"));
      // refetch if failed
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${JSON.parse(atob(token.split(".")[1])).id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOffers(response.data);
      setLoading(false);
    }
  };

  return (
    <main className="bg-[#F9FAF5] min-h-screen pt-4 pb-4 flex flex-col items-center">
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
      <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl lg:max-w-6xl flex flex-col space-y-6 sm:space-y-8 md:space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-green-900">
              {t("provider.home.title")}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              {t("provider.home.subtitle")}
            </p>
          </div>
          <button
            data-tour="publish-button"
            onClick={() => router.push("./publish")}
            className="flex items-center gap-2 px-5 py-3 bg-green-100 text-green-800 font-semibold rounded-xl shadow-md hover:bg-green-600 hover:text-white transition duration-300 transform hover:scale-[1.02] min-h-[44px] w-full sm:w-auto"
          >
            <PlusCircle size={22} />
            {t("provider.home.publish_offer")}
          </button>
        </div>

        {/* Offers Grid */}
        {loading ? (
          <p className="text-gray-600 text-lg text-center mt-10">{t("provider.home.loading_offers")}</p>
        ) : error ? (
          <p className="text-red-600 text-center mt-10">{error}</p>
        ) : offers.length === 0 ? (
          <p className="text-gray-600 text-lg text-center mt-10">
            {t("provider.home.no_offers")}
          </p>
        ) : (
          <div data-tour="offers-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {offers.map((offer) => {
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
        pickupLocation={currentLocation}
        mapsLink={currentMapsLink}
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
