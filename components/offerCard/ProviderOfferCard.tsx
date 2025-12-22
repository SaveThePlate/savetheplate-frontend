"use client";

import { FC, useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CancelTokenSource } from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "react-toastify";
import { ProviderOfferCardProps, FoodType, Taste } from "./types";
import { PriceBadge } from "./shared/PriceBadge";
import { QuantityBadge } from "./shared/QuantityBadge";
import { ProviderOverlay } from "./shared/ProviderOverlay";
import { formatDateTime, formatDateTimeRange, isOfferExpired, DEFAULT_LOGO, getImageFallbacksForOffer } from "./utils";
import { shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { compressImages, shouldCompress } from "@/utils/imageCompression";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { Clock, MapPin, Package, Edit2, X, Check, Calendar } from "lucide-react";
import { useBlobUrl } from "@/hooks/useBlobUrl";

export const ProviderOfferCard: FC<ProviderOfferCardProps> = ({
  offerId,
  imageSrc,
  imageAlt = "Offer image",
  title,
  description,
  price,
  originalPrice,
  quantity,
  expirationDate,
  pickupStartTime,
  pickupEndTime,
  pickupLocation,
  mapsLink,
  foodType,
  taste,
  owner,
  onDelete,
  onUpdate,
}) => {
  const router = useRouter();
  const { t } = useLanguage();
  const { createBlobUrl, revokeBlobUrl } = useBlobUrl();
  const blobUrlMapRef = useRef<Map<File, string>>(new Map());
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localData, setLocalData] = useState({
    title,
    description,
    price,
    originalPrice: originalPrice || "",
    quantity,
    expirationDate: expirationDate || "",
    pickupStartTime: pickupStartTime || "",
    pickupEndTime: pickupEndTime || "",
    // pickupLocation and mapsLink are managed from profile, not stored in local state
    foodType: foodType || "other" as FoodType,
    taste: taste || "neutral" as Taste,
  });
  
  // Image upload state
  const [localFiles, setLocalFiles] = useState<File[] | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{
    filename: string;
    url: string;
    absoluteUrl: string;
  }>>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Image display state
  const [currentImage, setCurrentImage] = useState<string | undefined>(imageSrc);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clear any pending timeouts
      if (deleteTimeoutRef.current) {
        clearTimeout(deleteTimeoutRef.current);
      }
    };
  }, []);

  // Sync localData with props when they change
  useEffect(() => {
    if (!isMountedRef.current) return;
    setLocalData({
      title,
      description,
      price,
      originalPrice: originalPrice || "",
      quantity,
      expirationDate: expirationDate || "",
      pickupStartTime: pickupStartTime || "",
      pickupEndTime: pickupEndTime || "",
      // pickupLocation and mapsLink are managed from profile, not synced
      foodType: foodType || "other" as FoodType,
      taste: taste || "neutral" as Taste,
    });
  }, [title, description, price, originalPrice, quantity, expirationDate, pickupStartTime, pickupEndTime, foodType, taste, offerId]);

  // Sync image display
  useEffect(() => {
    if (!isMountedRef.current) return;
    if (imageSrc) {
      const imageFallbacks = getImageFallbacksForOffer(imageSrc);
      setFallbacks(imageFallbacks);
      setCurrentImage(imageFallbacks[0] || DEFAULT_LOGO);
      setFallbackIndex(0);
    } else {
      setCurrentImage(DEFAULT_LOGO);
      setFallbacks([DEFAULT_LOGO]);
      setFallbackIndex(0);
    }
  }, [imageSrc]);

  const handleImageError = () => {
    if (!isMountedRef.current) return;
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < fallbacks.length) {
      setFallbackIndex(nextIndex);
      setCurrentImage(fallbacks[nextIndex]);
    } else {
      setCurrentImage(DEFAULT_LOGO);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const uploadFiles = async (files: File[]): Promise<Array<{ filename: string; url: string; absoluteUrl: string }>> => {
    // Compress images client-side before upload for faster transfer
    let filesToUpload = files;
    const needsCompression = files.some((f) => shouldCompress(f, 1));
    
    if (needsCompression) {
      try {
        // Removed info toast - compression happens automatically in background
        filesToUpload = await compressImages(files, {
          maxWidth: 1500,
          maxHeight: 1500,
          quality: 0.85,
          maxSizeMB: 1,
        });
        console.log("Images compressed:", filesToUpload.map(f => `${f.name}: ${(f.size / 1024 / 1024).toFixed(2)}MB`));
      } catch (error) {
        console.error("Compression error, uploading originals:", error);
        filesToUpload = files;
      }
    }

    const formData = new FormData();
    filesToUpload.forEach((file) => formData.append("files", file));

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token");

      const response = await axiosInstance.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: abortController.signal,
        timeout: 30000, // 30 second timeout
      });

      if (!isMountedRef.current) {
        throw new Error("Component unmounted");
      }

      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      const uploaded = Array.isArray(response.data) ? response.data : [response.data];
      
      console.log("Upload response data:", uploaded); // Debug log

      const mapped = uploaded.map((item: any) => {
        const filename = item.filename || item.path || item.url || item.absoluteUrl || "";
        let url = item.url || item.path || item.absoluteUrl || filename;
        let absoluteUrl = item.absoluteUrl || url;

        if (url.startsWith("http://") || url.startsWith("https://")) {
          absoluteUrl = url;
        } else if (url.startsWith("/storage/") && backendUrl) {
          absoluteUrl = `${backendUrl}${url}`;
        } else if (backendUrl) {
          absoluteUrl = `${backendUrl}/storage/${filename}`;
        } else {
          absoluteUrl = url;
        }

        console.log("Constructed image URL:", { filename, url, absoluteUrl }); // Debug log

        return {
          filename: filename,
          url: url,
          absoluteUrl: absoluteUrl,
        };
      });
      return mapped;
    } catch (err: any) {
      // Don't show error if component unmounted or request was cancelled
      if (err.name === 'AbortError' || !isMountedRef.current) {
        throw err;
      }
      console.error("Upload error", err?.response?.data || err.message || err);
      const errorMessage = sanitizeErrorMessage(err, {
        action: "upload images",
        defaultMessage: "Unable to upload images. Please check the files and try again."
      });
      toast.error(errorMessage);
      throw err;
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleImageUpload = async (files: File[] | null) => {
    if (!isMountedRef.current) return;
    
    if (!files || files.length === 0) {
      if (isMountedRef.current) {
        // Revoke blob URLs before clearing
        if (localFiles) {
          localFiles.forEach((file) => {
            const blobUrl = blobUrlMapRef.current.get(file);
            if (blobUrl) {
              revokeBlobUrl(blobUrl);
              blobUrlMapRef.current.delete(file);
            }
          });
        }
        setLocalFiles(null);
        setUploadedImages([]);
      }
      return;
    }
    
    // Set local files immediately to show preview right away
    if (isMountedRef.current) {
      setLocalFiles(files);
      setUploadingImages(true);
    }
    
    // Upload images in the background
    try {
      const uploaded = await uploadFiles(files);
      if (isMountedRef.current) {
        setUploadedImages(uploaded);
        // Removed success toast - user can see uploaded images in preview
      }
    } catch (error: any) {
      // Only update state and show error if component is still mounted and error is not from cancellation
      if (isMountedRef.current && error.name !== 'AbortError' && error.message !== 'Component unmounted') {
        // Revoke blob URLs on error
        if (localFiles) {
          localFiles.forEach((file) => {
            const blobUrl = blobUrlMapRef.current.get(file);
            if (blobUrl) {
              revokeBlobUrl(blobUrl);
              blobUrlMapRef.current.delete(file);
            }
          });
        }
        setLocalFiles(null);
        setUploadedImages([]);
        toast.error(t("offer_card.upload_failed"));
      }
    } finally {
      if (isMountedRef.current) {
        setUploadingImages(false);
      }
    }
  };

  const handleEdit = async () => {
    if (!isMountedRef.current) return;
    
    if (!localData.title) {
      toast.error(t("offer_card.fill_fields"));
      return;
    }

    // Validate required fields (pickupLocation is now from profile, not required)
    if (!localData.price || !localData.quantity || !localData.expirationDate || !localData.pickupStartTime || !localData.pickupEndTime) {
      toast.error(t("offer_card.fill_fields"));
      return;
    }

    // Validate time range
    if (localData.pickupStartTime && localData.pickupEndTime) {
      const startTime = new Date(localData.pickupStartTime);
      const endTime = new Date(localData.pickupEndTime);
      if (endTime <= startTime) {
        toast.error(t("add_offer.error_time_order"));
        return;
      }
    }

    if (isMountedRef.current) {
      setLoading(true);
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      if (isMountedRef.current) {
        setLoading(false);
      }
      return router.push("/signIn");
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Upload images if new files were selected
      let finalImages = uploadedImages;
      if (localFiles && localFiles.length > 0) {
        // Always upload when localFiles are present (user has selected new files)
        // Removed info toast - user can see upload status in UI
        finalImages = await uploadFiles(localFiles);
        if (isMountedRef.current) {
          setUploadedImages(finalImages);
        }
      }

      // Parse and validate price
      const priceValue = parseFloat(String(localData.price).trim());
      if (isNaN(priceValue) || priceValue <= 0) {
        if (isMountedRef.current) {
          toast.error(t("offer_card.invalid_price"));
          setLoading(false);
        }
        return;
      }

      // Parse and validate quantity
      const quantityValue = parseInt(String(localData.quantity).trim(), 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        if (isMountedRef.current) {
          toast.error(t("offer_card.invalid_quantity"));
          setLoading(false);
        }
        return;
      }

      // Parse originalPrice - include it if it's a valid positive number
      let originalPriceValue: number | undefined = undefined;
      const originalPriceStr = localData.originalPrice as any;
      if (originalPriceStr && String(originalPriceStr).trim() !== "") {
        const parsed = parseFloat(String(originalPriceStr).trim());
        if (!isNaN(parsed) && parsed > 0) {
          originalPriceValue = parsed;
        }
      }

      // Validate expiration date
      const expirationDateValue = new Date(localData.expirationDate);
      if (isNaN(expirationDateValue.getTime())) {
        if (isMountedRef.current) {
          toast.error(t("offer_card.invalid_date"));
          setLoading(false);
        }
        return;
      }

      // Prepare images payload if images were uploaded
      let imagesPayload: any = undefined;
      if (finalImages && finalImages.length > 0) {
        imagesPayload = finalImages.map((img) => ({
          filename: img.filename,
          url: img.url,
          absoluteUrl: img.absoluteUrl,
          original: img.url.startsWith("/") && !img.url.startsWith("/storage/") 
            ? { url: img.url }
            : undefined,
        }));
      }

      // Note: pickupLocation and mapsLink will be set from user's profile on the backend
      const payload: any = {
        title: String(localData.title).trim(),
        description: String(localData.description || '').trim(), // Allow empty description
        price: priceValue,
        quantity: quantityValue,
        expirationDate: localData.expirationDate,
        pickupStartTime: localData.pickupStartTime,
        pickupEndTime: localData.pickupEndTime,
        // mapsLink removed - always comes from user profile
        foodType: localData.foodType,
        taste: localData.taste,
      };

      // Only include originalPrice if it has a value (don't send undefined)
      if (originalPriceValue !== undefined) {
        payload.originalPrice = originalPriceValue;
      }

      // Include images only if new ones were uploaded (backend will handle the JSON string)
      if (imagesPayload && imagesPayload.length > 0) {
        payload.images = JSON.stringify(imagesPayload);
      }

      const response = await axiosInstance.put(`/offers/${offerId}`, payload, {
        signal: abortController.signal,
      });
      
      if (!isMountedRef.current) {
        return;
      }
      
      console.log("✅ PUT response:", response.data);
      console.log("✅ Response images:", response.data?.images);
      console.log("✅ Images is array?", Array.isArray(response.data?.images));
      
      toast.success(t("offer_card.offer_updated"));
      setLocalData({
        ...localData,
        originalPrice: originalPriceValue !== undefined ? String(originalPriceValue) : "",
      });
      setLocalFiles(null);
      setUploadedImages([]);
      setIsEditing(false);
      // Pass the response data (updated offer) to onUpdate if available, otherwise use payload
      onUpdate?.(offerId, response.data || payload);
    } catch (err: any) {
      // Don't show error if component unmounted or request was cancelled
      if (err.name === 'AbortError' || !isMountedRef.current) {
        return;
      }
      console.error("Error updating offer:", err);
      const errorMessage = sanitizeErrorMessage(err, {
        action: "update offer",
        defaultMessage: t("offer_card.update_failed") || "Unable to update offer. Please try again."
      });
      toast.error(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleDelete = async () => {
    if (!isMountedRef.current) return;
    
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    
    // Clear any existing timeout
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    
    deleteTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        onDelete?.(offerId);
      }
      deleteTimeoutRef.current = null;
    }, 250);
  };

  const { date: formattedDate, time: formattedTime } = formatDateTimeRange(
    pickupStartTime,
    pickupEndTime,
    expirationDate
  );
  const expired = isOfferExpired(expirationDate);
  const isRescuePack = title.toLowerCase().includes("rescue pack");
  const isLowStock = !expired && quantity > 0 && quantity <= 5;
  const isActive = !expired && quantity > 0;

  return (
    <Card className={`flex flex-col bg-white rounded-xl sm:rounded-2xl overflow-hidden border transition-all hover:shadow-lg ${
      expired ? "border-gray-200 opacity-75" : isLowStock ? "border-amber-200" : "border-gray-100"
    } ${isDeleting ? "opacity-0 scale-95" : ""}`}>
      {/* Image */}
      <div className="relative w-full h-32 sm:h-40 md:h-44">
        {currentImage ? (
          <Image
            src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onError={handleImageError}
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,..."
            className="object-cover"
            unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}

        <PriceBadge price={price} originalPrice={originalPrice} />
        <QuantityBadge quantity={quantity} isExpired={expired} position="bottom-right" />
        <ProviderOverlay owner={owner} pickupLocation={owner?.location || pickupLocation} />

        {/* Status Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
          {expired ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 px-2 sm:px-2.5 py-1 sm:py-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-600"></div>
                <span className="text-[10px] sm:text-xs font-semibold text-gray-800">
                  {t("common.expired")}
                </span>
              </div>
            </div>
          ) : isLowStock ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 px-2 sm:px-2.5 py-1 sm:py-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500"></div>
                <span className="text-[10px] sm:text-xs font-semibold text-amber-700">
                  {t("provider.home.status.low_stock")}
                </span>
              </div>
            </div>
          ) : isActive ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 px-2 sm:px-2.5 py-1 sm:py-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></div>
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-700">
                  {t("provider.home.status.active")}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-2.5 sm:p-3 md:p-4">
        <CardHeader className="p-0 mb-2 sm:mb-2.5">
          <CardTitle className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1 sm:mb-1.5 line-clamp-2">
            {title}
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs md:text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2 sm:mb-2.5">
            {description}
          </CardDescription>
          
          {/* Category Badges */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
            {foodType && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] md:text-xs font-semibold bg-blue-100 text-blue-800">
                {foodType === "snack" && "🍪"}
                {foodType === "meal" && "🍽️"}
                {foodType === "beverage" && "🥤"}
                {foodType === "other" && "📦"}
                <span className="ml-0.5 sm:ml-1 capitalize">{foodType}</span>
              </span>
            )}
            {taste && (
              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] md:text-xs font-semibold bg-purple-100 text-purple-800">
                {taste === "sweet" && "🍰"}
                {taste === "salty" && "🧂"}
                {taste === "both" && "🍬"}
                {taste === "neutral" && "⚪"}
                <span className="ml-0.5 sm:ml-1 capitalize">{taste}</span>
              </span>
            )}
          </div>

          {/* Pickup Time */}
          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs md:text-sm text-gray-600">
            <span className="text-xs sm:text-sm">🕐</span>
            <span className="truncate">
              {formattedDate === "Today" ? t("common.today") : formattedDate}
              {formattedTime && (
                <span className="font-semibold text-emerald-700 ml-0.5 sm:ml-1">
                  {formattedTime.includes(" - ") ? formattedTime : ` ${t("common.at")} ${formattedTime}`}
                </span>
              )}
            </span>
          </div>
        </CardHeader>

        {/* Footer Buttons */}
        <CardFooter className="mt-auto pt-2 sm:pt-3 md:pt-4 flex w-full gap-1.5 sm:gap-2 border-t border-gray-100 px-0 pb-0">
          {/* Edit Modal */}
          <div className="flex-1 min-w-0">
            <Credenza 
              open={isEditing} 
              onOpenChange={(open) => {
                setIsEditing(open);
                setEditingField(null);
                if (!open) {
                      // Reset all form data to original values
                      setLocalData({
                        title,
                        description,
                        price,
                        originalPrice: originalPrice || "",
                        quantity,
                        expirationDate: expirationDate || "",
                        pickupStartTime: pickupStartTime || "",
                        pickupEndTime: pickupEndTime || "",
                        // pickupLocation and mapsLink are managed from profile
                        foodType: foodType || "other" as FoodType,
                        taste: taste || "neutral" as Taste,
                      });
                  setLocalFiles(null);
                  setUploadedImages([]);
                  setUploadingImages(false);
                }
              }}
            >
              <CredenzaTrigger asChild>
                <button
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-xs md:text-sm shadow-sm"
                >
                  {t("common.edit")}
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white !rounded-none shadow-2xl w-full md:max-w-xl lg:max-w-2xl border-0 md:border border-border p-0 overflow-hidden max-h-[92vh] md:max-h-[90vh] flex flex-col [&>button]:!hidden">
                {/* Hero Image */}
                <div className="relative w-full h-40 sm:h-48 lg:h-44 flex-shrink-0 overflow-hidden">
                  {currentImage ? (
                    <Image
                      src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) calc(100vw - 1rem), 512px"
                      className="object-cover"
                      unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-muted to-secondary flex items-center justify-center">
                      <span className="text-muted-foreground">No image</span>
                    </div>
                  )}
                  
                  {/* Close Button - Top Right */}
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditingField(null);
                      setLocalData({
                        title,
                        description,
                        price,
                        originalPrice: originalPrice || "",
                        quantity,
                        expirationDate: expirationDate || "",
                        pickupStartTime: pickupStartTime || "",
                        pickupEndTime: pickupEndTime || "",
                        foodType: foodType || "other" as FoodType,
                        taste: taste || "neutral" as Taste,
                      });
                      setLocalFiles(null);
                      setUploadedImages([]);
                      setUploadingImages(false);
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 rounded-full bg-white p-1.5 shadow-lg hover:bg-gray-50 transition-colors border border-border flex items-center justify-center cursor-pointer"
                    aria-label="Close"
                    type="button"
                  >
                    <X className="h-4 w-4 text-foreground" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="bg-white flex-1 min-h-0 flex flex-col">
                  {/* Title and Pricing Section */}
                  <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-border">
                    {/* Title - Editable */}
                    {editingField === "title" ? (
                      <div className="mb-2">
                        <input
                          type="text"
                          value={localData.title}
                          onChange={(e) => setLocalData(prev => ({ ...prev, title: e.target.value }))}
                          onBlur={() => setEditingField(null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              setEditingField(null);
                            }
                          }}
                          className="w-full text-base sm:text-lg font-bold text-foreground px-2 py-1 border-2 border-emerald-500 rounded-lg focus:outline-none"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <h1 
                        className="text-base sm:text-lg font-bold text-foreground mb-1.5 cursor-pointer hover:text-emerald-600 transition-colors flex items-center gap-2 group"
                        onClick={() => setEditingField("title")}
                      >
                        {localData.title}
                        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h1>
                    )}
                    
                    {/* Pricing - Editable */}
                    <div className="flex items-baseline gap-2">
                      {editingField === "price" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={localData.price}
                            onChange={(e) => setLocalData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            onBlur={() => setEditingField(null)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                setEditingField(null);
                              }
                            }}
                            className="w-24 text-xl sm:text-2xl font-bold text-emerald-600 px-2 py-1 border-2 border-emerald-500 rounded-lg focus:outline-none"
                            autoFocus
                          />
                          <span className="text-emerald-600 font-bold">dt</span>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:text-emerald-700 transition-colors group"
                          onClick={() => setEditingField("price")}
                        >
                          {localData.originalPrice && parseFloat(localData.originalPrice as any) > localData.price ? (
                            <>
                              <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground line-through">
                                  {parseFloat(localData.originalPrice as any).toFixed(2)} dt
                                </span>
                                <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                                  {localData.price.toFixed(2)} dt
                                </span>
                              </div>
                              <div className="flex-1" />
                              <div className="bg-emerald-50 border border-emerald-200 rounded-md px-2 py-0.5">
                                <span className="text-[10px] font-bold text-emerald-700">
                                  {Math.round(((parseFloat(localData.originalPrice as any) - localData.price) / parseFloat(localData.originalPrice as any)) * 100)}% {t("offers.save") || "SAVED"}
                                </span>
                              </div>
                            </>
                          ) : (
                            <span className="text-xl sm:text-2xl font-bold text-emerald-600">
                              {localData.price.toFixed(2)} dt
                            </span>
                          )}
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description - Editable */}
                  {editingField === "description" ? (
                    <div className="px-4 sm:px-5 py-2 border-b border-border">
                      <textarea
                        value={localData.description}
                        onChange={(e) => setLocalData(prev => ({ ...prev, description: e.target.value }))}
                        onBlur={() => setEditingField(null)}
                        rows={3}
                        maxLength={500}
                        className="w-full text-xs text-muted-foreground leading-relaxed px-2 py-1 border-2 border-emerald-500 rounded-lg focus:outline-none resize-none"
                        autoFocus
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {(localData.description?.length || 0)}/500
                      </p>
                    </div>
                  ) : (
                    <div 
                      className="px-4 sm:px-5 py-2 border-b border-border cursor-pointer hover:bg-gray-50 transition-colors group"
                      onClick={() => setEditingField("description")}
                    >
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-2 flex items-start gap-2">
                        <span className="flex-1">{localData.description || t("offer_card.description_label")}</span>
                        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
                      </p>
                    </div>
                  )}

                  {/* Key Information Cards - Editable */}
                  <div className="px-4 sm:px-5 py-2 flex-1 min-h-0 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-2">
                      {/* Pickup Time - Editable */}
                      {editingField === "pickupTime" ? (
                        <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border-2 border-amber-300">
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <label className="text-[10px] font-semibold text-foreground block mb-1">
                                {t("add_offer.pickup_date")}
                              </label>
                              <input
                                type="date"
                                value={localData.expirationDate ? (() => {
                                  const date = new Date(localData.expirationDate);
                                  const year = date.getFullYear();
                                  const month = String(date.getMonth() + 1).padStart(2, '0');
                                  const day = String(date.getDate()).padStart(2, '0');
                                  return `${year}-${month}-${day}`;
                                })() : ""}
                                onChange={(e) => {
                                  const dateValue = e.target.value;
                                  if (dateValue) {
                                    const [year, month, day] = dateValue.split('-').map(Number);
                                    const date = new Date(year, month - 1, day, 23, 59, 59, 999);
                                    setLocalData(prev => ({ ...prev, expirationDate: date.toISOString() }));
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs border-2 border-emerald-500 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-semibold text-foreground block mb-1">
                                  {t("add_offer.start_time")}
                                </label>
                                <input
                                  type="time"
                                  value={localData.pickupStartTime ? new Date(localData.pickupStartTime).toISOString().slice(0, 16).split('T')[1] : ""}
                                  onChange={(e) => {
                                    const timeValue = e.target.value;
                                    if (timeValue && localData.expirationDate) {
                                      const [hours, minutes] = timeValue.split(':');
                                      const expDate = new Date(localData.expirationDate);
                                      const date = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate(), parseInt(hours), parseInt(minutes), 0, 0);
                                      setLocalData(prev => ({ ...prev, pickupStartTime: date.toISOString() }));
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-xs border-2 border-emerald-500 rounded-lg focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-foreground block mb-1">
                                  {t("add_offer.end_time")}
                                </label>
                                <input
                                  type="time"
                                  value={localData.pickupEndTime ? new Date(localData.pickupEndTime).toISOString().slice(0, 16).split('T')[1] : ""}
                                  onChange={(e) => {
                                    const timeValue = e.target.value;
                                    if (timeValue && localData.expirationDate) {
                                      const [hours, minutes] = timeValue.split(':');
                                      const expDate = new Date(localData.expirationDate);
                                      const date = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate(), parseInt(hours), parseInt(minutes), 0, 0);
                                      setLocalData(prev => ({ ...prev, pickupEndTime: date.toISOString() }));
                                    }
                                  }}
                                  className="w-full px-2 py-1 text-xs border-2 border-emerald-500 rounded-lg focus:outline-none"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => setEditingField(null)}
                              className="mt-2 px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700"
                            >
                              <Check className="w-3 h-3 inline mr-1" />
                              {t("common.done") || "Done"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 cursor-pointer hover:border-amber-300 transition-colors group"
                          onClick={() => setEditingField("pickupTime")}
                        >
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5 text-amber-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-foreground mb-0.5 flex items-center gap-2">
                              {t("offers.pickup_time") || "Pickup Time"}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              <span className="font-medium">{formattedDate === "Today" ? t("common.today") : formattedDate}</span>
                              {formattedTime && (
                                <span className="text-emerald-600 font-semibold ml-1">
                                  {formattedTime.includes(" - ") ? formattedTime : ` ${t("common.at")} ${formattedTime}`}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Quantity - Editable */}
                      {editingField === "quantity" ? (
                        <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border-2 border-green-300">
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-green-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-semibold text-foreground block mb-1">
                              {t("offers.quantity_available") || "Available"}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={localData.quantity}
                                onChange={(e) => setLocalData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                                onBlur={() => setEditingField(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setEditingField(null);
                                  }
                                }}
                                className="w-20 px-2 py-1 text-xs border-2 border-emerald-500 rounded-lg focus:outline-none"
                                autoFocus
                              />
                              <span className="text-[10px] text-muted-foreground">
                                {localData.quantity === 1 ? t("common.item") || "item" : t("common.items") || "items"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="flex items-start gap-2 p-2 bg-green-50 rounded-lg border border-green-200 cursor-pointer hover:border-green-300 transition-colors group"
                          onClick={() => setEditingField("quantity")}
                        >
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                            <Package className="w-3.5 h-3.5 text-green-700" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-foreground mb-0.5 flex items-center gap-2">
                              {t("offers.quantity_available") || "Available"}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {localData.quantity} {localData.quantity === 1 ? t("common.item") || "item" : t("common.items") || "items"}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Original Price - Editable */}
                      {editingField === "originalPrice" ? (
                        <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border-2 border-blue-300">
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 text-sm">💰</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <label className="text-[10px] font-semibold text-foreground block mb-1">
                              {t("offer_card.original_price_label")}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={localData.originalPrice}
                                onChange={(e) => setLocalData(prev => ({ ...prev, originalPrice: e.target.value }))}
                                onBlur={() => setEditingField(null)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setEditingField(null);
                                  }
                                }}
                                className="w-24 px-2 py-1 text-xs border-2 border-emerald-500 rounded-lg focus:outline-none"
                                placeholder="0.00"
                                autoFocus
                              />
                              <span className="text-xs text-muted-foreground">dt</span>
                            </div>
                          </div>
                        </div>
                      ) : localData.originalPrice && parseFloat(localData.originalPrice as any) > localData.price ? (
                        <div 
                          className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200 cursor-pointer hover:border-blue-300 transition-colors group"
                          onClick={() => setEditingField("originalPrice")}
                        >
                          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 text-sm">💰</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-foreground mb-0.5 flex items-center gap-2">
                              {t("offer_card.original_price_label")}
                              <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-[10px] text-muted-foreground line-through">
                              {parseFloat(localData.originalPrice as any).toFixed(2)} dt
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {/* Categories - Editable */}
                      <div className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-700 text-sm">🏷️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-foreground mb-1">
                            {t("offer_card.categories") || "Categories"}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={localData.foodType}
                              onChange={(e) => setLocalData(prev => ({ ...prev, foodType: e.target.value as FoodType }))}
                              className="px-2 py-1 text-[10px] border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                              disabled={loading}
                            >
                              <option value="snack">{t("offer_card.food_type_snack")}</option>
                              <option value="meal">{t("offer_card.food_type_meal")}</option>
                              <option value="beverage">{t("offer_card.food_type_beverage")}</option>
                              <option value="other">{t("offer_card.food_type_other")}</option>
                            </select>
                            <select
                              value={localData.taste}
                              onChange={(e) => setLocalData(prev => ({ ...prev, taste: e.target.value as Taste }))}
                              className="px-2 py-1 text-[10px] border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none bg-white"
                              disabled={loading}
                            >
                              <option value="sweet">{t("offer_card.taste_sweet")}</option>
                              <option value="salty">{t("offer_card.taste_salty")}</option>
                              <option value="both">{t("offer_card.taste_both")}</option>
                              <option value="neutral">{t("offer_card.taste_neutral")}</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Pickup Location Info */}
                      <div className="flex items-start gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-foreground mb-0.5">
                            {t("offers.pickup_location") || "Pickup Location"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {owner?.location || pickupLocation || "Location"}
                          </p>
                        </div>
                      </div>

                      {/* Image Upload */}
                      <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-gray-700 text-sm">📸</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-foreground mb-1">
                            {t("offer_card.images_label")}
                          </p>
                          <FileUploader
                            value={localFiles || []}
                            onValueChange={handleImageUpload}
                            dropzoneOptions={{
                              accept: { "image/*": [".jpg", ".jpeg", ".png"] },
                              multiple: false,
                              maxFiles: 1,
                              maxSize: 5 * 1024 * 1024,
                            }}
                          >
                            <FileInput>
                              <div className="flex flex-col items-center justify-center h-20 w-full border-2 border-dashed border-gray-300 bg-white hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
                                {uploadingImages ? (
                                  <>
                                    <div className="animate-spin text-lg mb-1">⏳</div>
                                    <p className="text-[10px] text-muted-foreground">{t("offer_card.uploading")}</p>
                                  </>
                                ) : localFiles && localFiles.length > 0 ? (
                                  <>
                                    <div className="text-lg mb-1">✓</div>
                                    <p className="text-[10px] text-muted-foreground">{t("offer_card.images_ready", { count: localFiles.length })}</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="text-[10px] text-muted-foreground">{t("offer_card.click_upload")}</p>
                                  </>
                                )}
                              </div>
                            </FileInput>
                            <FileUploaderContent>
                              {localFiles && localFiles.length > 0 && localFiles.map((file, index) => {
                                const uploadedImage = uploadedImages.length > 0 && uploadedImages[index];
                                const isUploaded = !!uploadedImage;
                                let imageSrc: string;
                                if (isUploaded && uploadedImage) {
                                  imageSrc = uploadedImage.absoluteUrl || uploadedImage.url || "";
                                  if (imageSrc && !imageSrc.startsWith("http") && !imageSrc.startsWith("/")) {
                                    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                                    imageSrc = `${backendUrl}/storage/${imageSrc}`;
                                  } else if (imageSrc && imageSrc.startsWith("/storage/")) {
                                    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                                    imageSrc = `${backendUrl}${imageSrc}`;
                                  }
                                  if (imageSrc && !imageSrc.includes("?") && !imageSrc.includes("#")) {
                                    imageSrc += `?t=${Date.now()}`;
                                  }
                                } else {
                                  // Get or create blob URL for this file
                                  let blobUrl: string | null | undefined = blobUrlMapRef.current.get(file);
                                  if (!blobUrl) {
                                    blobUrl = createBlobUrl(file);
                                    if (blobUrl) {
                                      blobUrlMapRef.current.set(file, blobUrl);
                                    }
                                  }
                                  imageSrc = blobUrl || "";
                                }
                                return (
                                  <FileUploaderItem
                                    key={`preview-${index}`}
                                    index={index}
                                    className={`size-16 p-0 rounded-lg overflow-hidden border-2 shadow-sm relative ${
                                      isUploaded ? "border-emerald-600" : "border-yellow-400"
                                    }`}
                                  >
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Image
                                        src={imageSrc || "/defaultBag.png"}
                                        alt={`Preview ${index + 1}`}
                                        width={64}
                                        height={64}
                                        className="w-full h-full object-cover rounded-lg"
                                        unoptimized={true}
                                      />
                                    </div>
                                    <div className={`absolute top-0.5 right-0.5 text-white text-[8px] px-1 py-0.5 rounded-full z-10 ${
                                      isUploaded ? "bg-emerald-600" : uploadingImages ? "bg-yellow-500" : "bg-yellow-400"
                                    }`}>
                                      {isUploaded ? "✓" : uploadingImages ? "⏳" : "📤"}
                                    </div>
                                  </FileUploaderItem>
                                );
                              })}
                            </FileUploaderContent>
                          </FileUploader>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="bg-white p-2.5 sm:p-3 flex-shrink-0 border-t border-border">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditingField(null);
                        // Reset form data to original values
                        setLocalData({
                          title,
                          description,
                          price,
                          originalPrice: originalPrice || "",
                          quantity,
                          expirationDate: expirationDate || "",
                          pickupStartTime: pickupStartTime || "",
                          pickupEndTime: pickupEndTime || "",
                          foodType: foodType || "other" as FoodType,
                          taste: taste || "neutral" as Taste,
                        });
                        setLocalFiles(null);
                        setUploadedImages([]);
                        setUploadingImages(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-white border border-border text-foreground text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                      disabled={loading}
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      onClick={handleEdit}
                      disabled={loading || uploadingImages}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? t("common.saving") : uploadingImages ? t("offer_card.uploading") : t("offer_card.save_changes")}
                    </button>
                  </div>
                </div>
              </CredenzaContent>
            </Credenza>
          </div>

          {/* Delete Modal */}
          <div className="flex-1 min-w-0">
            <Credenza open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <CredenzaTrigger asChild>
                <button className="w-full bg-red-500 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg sm:rounded-xl font-semibold hover:bg-red-600 transition-colors text-[10px] sm:text-xs md:text-sm shadow-sm">
                  {t("common.delete")}
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-3xl shadow-xl p-6 max-w-sm mx-auto border border-gray-100">
                <CredenzaHeader>
                  <CredenzaTitle className="text-lg font-semibold text-gray-900">
                    {t("offer_card.confirm_deletion")}
                  </CredenzaTitle>
                </CredenzaHeader>

                <CredenzaDescription className="text-sm text-gray-600 mt-2">
                  {t("offer_card.delete_message")}
                </CredenzaDescription>

                <CredenzaFooter className="flex justify-end gap-3 mt-4">
                  <button 
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
                  >
                    {t("common.delete")}
                  </button>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
};

