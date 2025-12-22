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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [saveSuccess, setSaveSuccess] = useState(false);
  
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
      
      setLocalData({
        ...localData,
        originalPrice: originalPriceValue !== undefined ? String(originalPriceValue) : "",
      });
      setLocalFiles(null);
      setUploadedImages([]);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => {
        if (isMountedRef.current) {
          setSaveSuccess(false);
        }
      }, 2000);
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
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary"></div>
                <span className="text-[10px] sm:text-xs font-semibold text-primary">
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
                <span className="font-semibold text-primary ml-0.5 sm:ml-1">
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
                <Button
                  disabled={loading}
                  variant="emerald"
                  size="sm"
                  className="w-full"
                >
                  {t("common.edit")}
                </Button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-xl shadow-2xl w-full md:max-w-2xl lg:max-w-3xl border border-border p-0 overflow-hidden max-h-[92vh] md:max-h-[90vh] flex flex-col [&>button]:!hidden">
                {/* Header */}
                <CredenzaHeader className="flex items-center justify-between p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                  <div>
                    <CredenzaTitle className="text-xl font-bold text-foreground">{t("common.edit") || "Edit Offer"}</CredenzaTitle>
                    <CredenzaDescription className="text-sm text-muted-foreground mt-1">{t("offer_card.edit_description") || "Update your offer details below"}</CredenzaDescription>
                  </div>
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
                    className="rounded-full bg-white p-2 shadow-sm hover:bg-gray-50 transition-colors border border-border"
                    aria-label="Close"
                    type="button"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                </CredenzaHeader>

                {/* Form Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                      {t("offer_card.basic_info") || "Basic Information"}
                    </h3>
                    
                    {/* Title */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("offer_card.title_label") || "Title"} <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="text"
                        value={localData.title}
                        onChange={(e) => setLocalData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={t("offer_card.title_placeholder") || "Enter offer title"}
                        className="w-full"
                        disabled={loading}
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        {t("offer_card.description_label") || "Description"}
                      </label>
                      <textarea
                        value={localData.description}
                        onChange={(e) => setLocalData(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        maxLength={500}
                        placeholder={t("offer_card.description_placeholder") || "Describe your offer..."}
                        className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {(localData.description?.length || 0)}/500
                      </p>
                    </div>
                  </div>

                  {/* Pricing Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                      {t("offer_card.pricing") || "Pricing"}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Price */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("offer_card.price_label") || "Price"} <span className="text-destructive">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={localData.price}
                            onChange={(e) => setLocalData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            placeholder="0.00"
                            className="w-full pr-12"
                            disabled={loading}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">dt</span>
                        </div>
                      </div>

                      {/* Original Price */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("offer_card.original_price_label") || "Original Price"} <span className="text-xs text-muted-foreground">(optional)</span>
                        </label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={localData.originalPrice}
                            onChange={(e) => setLocalData(prev => ({ ...prev, originalPrice: e.target.value }))}
                            placeholder="0.00"
                            className="w-full pr-12"
                            disabled={loading}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">dt</span>
                        </div>
                        {localData.originalPrice && parseFloat(localData.originalPrice as any) > localData.price && (
                          <p className="text-xs text-success">
                            {Math.round(((parseFloat(localData.originalPrice as any) - localData.price) / parseFloat(localData.originalPrice as any)) * 100)}% {t("offers.save") || "SAVED"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Availability Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                      {t("offer_card.availability") || "Availability"}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Quantity */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("offers.quantity_available") || "Quantity"} <span className="text-destructive">*</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={localData.quantity}
                          onChange={(e) => setLocalData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                          placeholder="0"
                          className="w-full"
                          disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                          {localData.quantity === 1 ? t("common.item") || "item" : t("common.items") || "items"} {t("offer_card.available") || "available"}
                        </p>
                      </div>

                      {/* Expiration Date */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("add_offer.pickup_date") || "Expiration Date"} <span className="text-destructive">*</span>
                        </label>
                        <Input
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
                          className="w-full"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Pickup Times */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("add_offer.start_time") || "Pickup Start Time"}
                        </label>
                        <Input
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
                          className="w-full"
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("add_offer.end_time") || "Pickup End Time"}
                        </label>
                        <Input
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
                          className="w-full"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Categories Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                      {t("offer_card.categories") || "Categories"}
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("offer_card.food_type") || "Food Type"}
                        </label>
                        <select
                          value={localData.foodType}
                          onChange={(e) => setLocalData(prev => ({ ...prev, foodType: e.target.value as FoodType }))}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={loading}
                        >
                          <option value="snack">{t("offer_card.food_type_snack")}</option>
                          <option value="meal">{t("offer_card.food_type_meal")}</option>
                          <option value="beverage">{t("offer_card.food_type_beverage")}</option>
                          <option value="other">{t("offer_card.food_type_other")}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                          {t("offer_card.taste") || "Taste"}
                        </label>
                        <select
                          value={localData.taste}
                          onChange={(e) => setLocalData(prev => ({ ...prev, taste: e.target.value as Taste }))}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
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

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">
                      {t("offer_card.images_label") || "Image"}
                    </h3>
                    
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
                        <div className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-border bg-muted/50 hover:bg-muted rounded-lg transition-colors cursor-pointer">
                          {uploadingImages ? (
                            <>
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                              <p className="text-sm text-muted-foreground">{t("offer_card.uploading")}</p>
                            </>
                          ) : localFiles && localFiles.length > 0 ? (
                            <>
                              <Check className="w-8 h-8 text-success mb-2" />
                              <p className="text-sm text-muted-foreground">{t("offer_card.images_ready", { count: localFiles.length })}</p>
                            </>
                          ) : (
                            <>
                              <span className="text-4xl mb-2">📸</span>
                              <p className="text-sm font-medium text-foreground">{t("offer_card.click_upload") || "Click to upload image"}</p>
                              <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
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
                              className={`size-24 p-0 rounded-lg overflow-hidden border-2 shadow-sm relative ${
                                isUploaded ? "border-primary" : "border-warning"
                              }`}
                            >
                              <div className="w-full h-full flex items-center justify-center">
                                <Image
                                  src={imageSrc || "/defaultBag.png"}
                                  alt={`Preview ${index + 1}`}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover rounded-lg"
                                  unoptimized={true}
                                />
                              </div>
                              <div className={`absolute top-1 right-1 text-white text-xs px-1.5 py-0.5 rounded-full z-10 ${
                                isUploaded ? "bg-primary" : uploadingImages ? "bg-warning" : "bg-warning/80"
                              }`}>
                                {isUploaded ? "✓" : uploadingImages ? "⏳" : "📤"}
                              </div>
                            </FileUploaderItem>
                          );
                        })}
                      </FileUploaderContent>
                    </FileUploader>
                  </div>

                  {/* Pickup Location Info (Read-only) */}
                  <div className="space-y-2 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <label className="text-sm font-medium text-foreground">
                      {t("offers.pickup_location") || "Pickup Location"}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {owner?.location || pickupLocation || t("offer_card.location_from_profile") || "Set in your profile"}
                    </p>
                  </div>
                </div>

                {/* Fixed Bottom Action Bar */}
                <div className="bg-white p-4 sm:p-6 flex-shrink-0 border-t border-border">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="outline"
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
                      disabled={loading}
                      className="flex-1"
                    >
                      {t("common.cancel") || "Cancel"}
                    </Button>
                    <Button
                      onClick={handleEdit}
                      disabled={loading || uploadingImages}
                      className="flex-1 bg-primary hover:bg-primary/90"
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {t("common.saved") || "Saved"}
                        </>
                      ) : loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t("common.saving") || "Saving..."}
                        </>
                      ) : uploadingImages ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t("offer_card.uploading") || "Uploading..."}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          {t("offer_card.save_changes") || "Save Changes"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CredenzaContent>
            </Credenza>
          </div>

          {/* Delete Modal */}
          <div className="flex-1 min-w-0">
            <Credenza open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <CredenzaTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="w-full"
                >
                  {t("common.delete")}
                </Button>
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
                  <Button 
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                  >
                    {t("common.delete")}
                  </Button>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </div>
        </CardFooter>
      </div>
    </Card>
  );
};

