"use client";

import { FC, useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios, { CancelTokenSource } from "axios";
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
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  // Create axios instance for image uploads
  const axiosInstance = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, ""),
    headers: { "Content-Type": "application/json" },
  });

  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

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

      const response = await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${offerId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
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
    <Card className={`flex flex-col bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-lg ${
      expired ? "border-gray-200 opacity-75" : isLowStock ? "border-amber-200" : "border-gray-100"
    } ${isDeleting ? "opacity-0 scale-95" : ""}`}>
      {/* Image */}
      <div className="relative w-full h-48 sm:h-52">
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
        <div className="absolute top-3 left-3 z-10">
          {expired ? (
            <div className="bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {t("common.expired")}
            </div>
          ) : isLowStock ? (
            <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {t("provider.home.status.low_stock")}
            </div>
          ) : isActive ? (
            <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
              {t("provider.home.status.active")}
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <CardHeader className="p-0 mb-3">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-2">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-3">
            {description}
          </CardDescription>
          
          {/* Category Badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {foodType && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800">
                {foodType === "snack" && "🍪"}
                {foodType === "meal" && "🍽️"}
                {foodType === "beverage" && "🥤"}
                {foodType === "other" && "📦"}
                <span className="ml-1 capitalize">{foodType}</span>
              </span>
            )}
            {taste && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800">
                {taste === "sweet" && "🍰"}
                {taste === "salty" && "🧂"}
                {taste === "both" && "🍬"}
                {taste === "neutral" && "⚪"}
                <span className="ml-1 capitalize">{taste}</span>
              </span>
            )}
          </div>

          {/* Pickup Time */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 px-1">
            <span>🕐</span>
            <span>
              {formattedDate === "Today" ? t("common.today") : formattedDate}
              {formattedTime && (
                <span className="font-semibold text-emerald-700 ml-1">
                  {formattedTime.includes(" - ") ? formattedTime : ` ${t("common.at")} ${formattedTime}`}
                </span>
              )}
            </span>
          </div>
        </CardHeader>

        {/* Footer Buttons */}
        <CardFooter className="mt-auto pt-4 flex w-full gap-2 sm:gap-3 border-t border-gray-100">
          {/* Edit Modal */}
          <div className="flex-1">
            <Credenza 
              open={isEditing} 
              onOpenChange={(open) => {
                setIsEditing(open);
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
                  className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-sm"
                >
                  {t("common.edit")}
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-3xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 max-w-2xl mx-auto border border-gray-100 max-h-[90vh] overflow-y-auto">
                <CredenzaHeader className="mb-4 sm:mb-6">
                  <CredenzaTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                    {t("offer_card.edit_offer")}
                  </CredenzaTitle>
                  <CredenzaDescription className="text-sm text-gray-500 mt-2">
                    {t("offer_card.update_details")}
                  </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4 sm:space-y-5">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-title" className="text-xs sm:text-sm font-semibold text-gray-700">
                      {t("offer_card.title_label")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-title"
                      name="title"
                      value={localData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      placeholder={t("offer_card.title_label")}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-description" className="text-xs sm:text-sm font-semibold text-gray-700">
                      {t("offer_card.description_label")} <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={localData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
                      disabled={loading}
                      placeholder={t("offer_card.description_label")}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500">
                      {localData.description?.length || 0}/500 characters. Optional - helps customers understand your offer better.
                    </p>
                  </div>

                  {/* Price Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="edit-price" className="text-xs sm:text-sm font-semibold text-gray-700">
                        {t("offer_card.price_label")} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="edit-price"
                          type="number"
                          step="0.01"
                          min="0"
                          name="price"
                          value={localData.price}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          disabled={loading}
                          placeholder="0.00"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">dt</span>
                      </div>
                      {localData.price && !isNaN(parseFloat(localData.price as any)) && parseFloat(localData.price as any) > 0 && (
                        <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-2 rounded border border-blue-200">
                          {t("offer_card.commission_notice", { 
                            price: parseFloat(localData.price as any).toFixed(2), 
                            finalPrice: (parseFloat(localData.price as any) + 1).toFixed(2) 
                          })}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="edit-originalPrice" className="text-xs sm:text-sm font-semibold text-gray-700">
                        {t("offer_card.original_price_label")}
                      </label>
                      <div className="relative">
                        <input
                          id="edit-originalPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          name="originalPrice"
                          value={localData.originalPrice}
                          onChange={handleInputChange}
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          disabled={loading}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">dt</span>
                      </div>
                      {localData.originalPrice && parseFloat(localData.originalPrice as any) > parseFloat(localData.price as any) && (
                        <p className="text-xs text-emerald-600 font-medium">
                          Save {((1 - parseFloat(localData.price as any) / parseFloat(localData.originalPrice as any)) * 100).toFixed(0)}%
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-quantity" className="text-xs sm:text-sm font-semibold text-gray-700">
                      {t("offer_card.quantity_label")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-quantity"
                      type="number"
                      min="0"
                      name="quantity"
                      value={localData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Pickup Date */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-expirationDate" className="text-xs sm:text-sm font-semibold text-gray-700">
                      {t("add_offer.pickup_date")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-expirationDate"
                      type="date"
                      name="expirationDate"
                      value={localData.expirationDate ? (() => {
                        // Convert ISO string to local date string (YYYY-MM-DD) to avoid timezone issues
                        const date = new Date(localData.expirationDate);
                        // Get local date components to avoid UTC conversion issues
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${year}-${month}-${day}`;
                      })() : ""}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          // Parse the date value (YYYY-MM-DD) and create date in local timezone
                          // Split the date string to avoid timezone conversion issues
                          const [year, month, day] = dateValue.split('-').map(Number);
                          // Create date at noon local time to avoid timezone shifts, then set to end of day
                          const date = new Date(year, month - 1, day, 23, 59, 59, 999);
                          setLocalData(prev => ({ ...prev, expirationDate: date.toISOString() }));
                        } else {
                          setLocalData(prev => ({ ...prev, expirationDate: "" }));
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Pickup Start Time */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-pickupStartTime" className="text-xs sm:text-sm font-semibold text-gray-700">
                      {t("add_offer.start_time")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-pickupStartTime"
                      type="time"
                      name="pickupStartTime"
                      value={localData.pickupStartTime ? new Date(localData.pickupStartTime).toISOString().slice(0, 16).split('T')[1] : ""}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        if (timeValue && localData.expirationDate) {
                          const [hours, minutes] = timeValue.split(':');
                          // Use the expiration date and set time in local timezone
                          const expDate = new Date(localData.expirationDate);
                          const date = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate(), parseInt(hours), parseInt(minutes), 0, 0);
                          setLocalData(prev => ({ ...prev, pickupStartTime: date.toISOString() }));
                        } else if (timeValue) {
                          const [hours, minutes] = timeValue.split(':');
                          const date = new Date();
                          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          setLocalData(prev => ({ ...prev, pickupStartTime: date.toISOString() }));
                        } else {
                          setLocalData(prev => ({ ...prev, pickupStartTime: "" }));
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Pickup End Time */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-pickupEndTime" className="text-xs sm:text-sm font-semibold text-gray-700">
                      {t("add_offer.end_time")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-pickupEndTime"
                      type="time"
                      name="pickupEndTime"
                      value={localData.pickupEndTime ? new Date(localData.pickupEndTime).toISOString().slice(0, 16).split('T')[1] : ""}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        if (timeValue && localData.expirationDate) {
                          const [hours, minutes] = timeValue.split(':');
                          // Use the expiration date and set time in local timezone
                          const expDate = new Date(localData.expirationDate);
                          const date = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate(), parseInt(hours), parseInt(minutes), 0, 0);
                          setLocalData(prev => ({ ...prev, pickupEndTime: date.toISOString() }));
                        } else if (timeValue) {
                          const [hours, minutes] = timeValue.split(':');
                          const date = new Date();
                          date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          setLocalData(prev => ({ ...prev, pickupEndTime: date.toISOString() }));
                        } else {
                          setLocalData(prev => ({ ...prev, pickupEndTime: "" }));
                        }
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Pickup Location Info */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 text-lg">📍</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-emerald-900 mb-1">
                          {t("add_offer.pickup_location")}
                        </h3>
                        <p className="text-xs text-emerald-700">
                          Pickup location is set from your profile. Update your location in profile settings if needed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Food Type */}
                    <div className="space-y-1.5">
                      <label htmlFor="edit-foodType" className="text-xs sm:text-sm font-semibold text-gray-700">
                        {t("offer_card.food_type_label")}
                      </label>
                      <select
                        id="edit-foodType"
                        name="foodType"
                        value={localData.foodType}
                        onChange={(e) => setLocalData(prev => ({ ...prev, foodType: e.target.value as FoodType }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                        disabled={loading}
                      >
                        <option value="snack">{t("offer_card.food_type_snack")}</option>
                        <option value="meal">{t("offer_card.food_type_meal")}</option>
                        <option value="beverage">{t("offer_card.food_type_beverage")}</option>
                        <option value="other">{t("offer_card.food_type_other")}</option>
                      </select>
                    </div>

                    {/* Taste */}
                    <div className="space-y-1.5">
                      <label htmlFor="edit-taste" className="text-xs sm:text-sm font-semibold text-gray-700">
                        {t("offer_card.taste_label")}
                      </label>
                      <select
                        id="edit-taste"
                        name="taste"
                        value={localData.taste}
                        onChange={(e) => setLocalData(prev => ({ ...prev, taste: e.target.value as Taste }))}
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                        disabled={loading}
                      >
                        <option value="sweet">{t("offer_card.taste_sweet")}</option>
                        <option value="salty">{t("offer_card.taste_salty")}</option>
                        <option value="both">{t("offer_card.taste_both")}</option>
                        <option value="neutral">{t("offer_card.taste_neutral")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Images Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-semibold text-gray-700">
                      {t("offer_card.images_label")} {uploadedImages.length > 0 && <span className="text-emerald-600">({t("offer_card.images_uploaded", { count: uploadedImages.length })})</span>}
                    </label>
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
                        <div className="flex flex-col items-center justify-center h-28 sm:h-32 w-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-lg sm:rounded-xl transition-colors cursor-pointer touch-manipulation">
                          {uploadingImages ? (
                            <>
                              <div className="animate-spin text-xl sm:text-2xl mb-1 sm:mb-2">⏳</div>
                              <p className="text-gray-600 text-xs sm:text-sm">{t("offer_card.uploading")}</p>
                            </>
                          ) : localFiles && localFiles.length > 0 ? (
                            <>
                              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">✓</div>
                              <p className="text-gray-600 text-xs sm:text-sm">{t("offer_card.images_ready", { count: localFiles.length })}</p>
                            </>
                          ) : (
                            <>
                              <div className="text-xl sm:text-2xl mb-1 sm:mb-2">📸</div>
                              <p className="text-gray-600 text-xs sm:text-sm">{t("offer_card.click_upload")}</p>
                              <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">{t("offer_card.up_to_5")}</p>
                            </>
                          )}
                        </div>
                      </FileInput>
                      <FileUploaderContent>
                        {localFiles && localFiles.length > 0 && localFiles.map((file, index) => {
                          // Check if this file has been uploaded
                          const uploadedImage = uploadedImages.length > 0 && uploadedImages[index];
                          const isUploaded = !!uploadedImage;
                          
                          // Determine image source - prioritize uploaded image URL
                          let imageSrc: string;
                          if (isUploaded && uploadedImage) {
                            // Use the uploaded image URL
                            imageSrc = uploadedImage.absoluteUrl || uploadedImage.url || "";
                            
                            // If we have a relative URL, construct absolute URL
                            if (imageSrc && !imageSrc.startsWith("http") && !imageSrc.startsWith("/")) {
                              const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                              imageSrc = `${backendUrl}/storage/${imageSrc}`;
                            } else if (imageSrc && imageSrc.startsWith("/storage/")) {
                              const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                              imageSrc = `${backendUrl}${imageSrc}`;
                            }
                            
                            // Add cache buster to ensure fresh image
                            if (imageSrc && !imageSrc.includes("?") && !imageSrc.includes("#")) {
                              imageSrc += `?t=${Date.now()}`;
                            }
                            
                            console.log("Using uploaded image URL:", imageSrc); // Debug log
                          } else {
                            // Use local file preview
                            imageSrc = URL.createObjectURL(file) || "";
                          }
                          
                          return (
                            <FileUploaderItem
                              key={`preview-${index}`}
                              index={index}
                              className={`size-20 sm:size-24 p-0 rounded-lg sm:rounded-xl overflow-hidden border-2 shadow-sm relative ${
                                isUploaded ? "border-emerald-600" : "border-yellow-400"
                              }`}
                            >
                              <div className="w-full h-full flex items-center justify-center">
                                <Image
                                  src={imageSrc || "/defaultBag.png"}
                                  alt={`Preview ${index + 1}`}
                                  width={96}
                                  height={96}
                                  className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                                  unoptimized={true}
                                />
                              </div>
                              <div className={`absolute top-1 right-1 text-white text-xs px-1.5 py-0.5 rounded-full z-10 ${
                                isUploaded 
                                  ? "bg-emerald-600" 
                                  : uploadingImages 
                                  ? "bg-yellow-500" 
                                  : "bg-yellow-400"
                              }`}>
                                {isUploaded ? "✓" : uploadingImages ? "⏳" : "📤"}
                              </div>
                            </FileUploaderItem>
                          );
                        })}
                      </FileUploaderContent>
                    </FileUploader>
                    <p className="text-xs text-gray-500">
                      {t("offer_card.images_hint")}
                    </p>
                  </div>
                </CredenzaBody>

                <CredenzaFooter className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-200 sticky bottom-0 bg-white z-10">
                  <button 
                    onClick={() => {
                      setIsEditing(false);
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
                        // pickupLocation and mapsLink are managed from profile
                        foodType: foodType || "other" as FoodType,
                        taste: taste || "neutral" as Taste,
                      });
                      setLocalFiles(null);
                      setUploadedImages([]);
                      setUploadingImages(false);
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-gray-100 text-gray-700 rounded-xl text-base font-semibold hover:bg-gray-200 transition-colors"
                    disabled={loading}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={loading || uploadingImages}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white rounded-xl text-base font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {loading ? t("common.saving") : uploadingImages ? t("offer_card.uploading") : t("offer_card.save_changes")}
                  </button>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </div>

          {/* Delete Modal */}
          <div className="flex-1">
            <Credenza open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <CredenzaTrigger asChild>
                <button className="w-full bg-red-500 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors text-sm sm:text-base shadow-sm">
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

