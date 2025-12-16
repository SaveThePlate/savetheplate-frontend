"use client";

import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import Image from "next/image";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DropzoneOptions } from "react-dropzone";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { compressImages, shouldCompress } from "@/utils/imageCompression";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";

type UploadedImage = {
  filename: string;
  url: string;
  absoluteUrl: string;
  blurhash?: string;
  width?: number;
  height?: number;
};

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

type FoodType = "snack" | "meal" | "beverage" | "other";
type Taste = "sweet" | "salty" | "both" | "neutral";

const AddOffer: React.FC = () => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupStartTime, setPickupStartTime] = useState("");
  const [pickupEndTime, setPickupEndTime] = useState("");
  // Pickup location is now taken from user's profile, no need for state
  const [foodType, setFoodType] = useState<FoodType>("other");
  const [taste, setTaste] = useState<Taste>("neutral");
  const [localFiles, setLocalFiles] = useState<File[] | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [offers, setOffers] = useState<{ price: number; title: string }[]>([]);

  useEffect(() => {
    // Keep uploaded images even if localFiles is cleared (they're already uploaded)
    // Only clear if localFiles is explicitly set to null
    if (localFiles === null && uploadedImages.length > 0) {
      setUploadedImages([]);
    }
  }, [localFiles, uploadedImages.length]);

  // Quick time presets
  const applyTimePreset = (preset: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formatTime = (hours: number, minutes: number = 0) => 
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    switch (preset) {
      case 'today-afternoon':
        setPickupDate(formatDate(today));
        setPickupStartTime(formatTime(14, 0)); // 2:00 PM
        setPickupEndTime(formatTime(18, 0)); // 6:00 PM
        break;
      case 'today-evening':
        setPickupDate(formatDate(today));
        setPickupStartTime(formatTime(17, 0)); // 5:00 PM
        setPickupEndTime(formatTime(20, 0)); // 8:00 PM
        break;
      case 'tomorrow-morning':
        setPickupDate(formatDate(tomorrow));
        setPickupStartTime(formatTime(10, 0)); // 10:00 AM
        setPickupEndTime(formatTime(14, 0)); // 2:00 PM
        break;
      case 'tomorrow-afternoon':
        setPickupDate(formatDate(tomorrow));
        setPickupStartTime(formatTime(14, 0)); // 2:00 PM
        setPickupEndTime(formatTime(18, 0)); // 6:00 PM
        break;
    }
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Basic Info
        return title.trim().length > 0;
      case 2: // Pricing
        const priceToFloat = parseFloat(price);
        const quantityToFloat = parseFloat(quantity);
        return !isNaN(priceToFloat) && priceToFloat > 0 && 
               !isNaN(quantityToFloat) && quantityToFloat > 0;
      case 3: // Availability
        if (!pickupDate || !pickupStartTime || !pickupEndTime) return false;
        const startDateTime = new Date(`${pickupDate}T${pickupStartTime}`);
        const endDateTime = new Date(`${pickupDate}T${pickupEndTime}`);
        return startDateTime < endDateTime && endDateTime > new Date();
      case 4: // Categories (always valid, optional fields)
        return true;
      default:
        return false;
    }
  };

  const canProceedToNextStep = (): boolean => {
    return validateStep(currentStep);
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ✅ Upload files
  async function uploadFiles(files: File[]): Promise<UploadedImage[]> {
    if (!files || files.length === 0) return [];

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
        // Continue with original files if compression fails
        filesToUpload = files;
      }
    }

    const fd = new FormData();
    filesToUpload.forEach((f) => fd.append("files", f));

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      
      // Add timeout for upload (30 seconds)
      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000, // 30 second timeout
      });

      const data = res.data as any[];
      console.log("Upload response data:", data); // Debug log
      
      const mapped: UploadedImage[] = data.map((item) => {
        // Construct proper URLs
        const filename = item.filename || item.path || "";
        const url = item.url || `/storage/${filename}`;
        
        // Build absoluteUrl - if backend returns a full URL, use it; otherwise construct it
        let absoluteUrl = item.absoluteUrl;
        if (!absoluteUrl) {
          if (url.startsWith("http://") || url.startsWith("https://")) {
            absoluteUrl = url;
          } else if (url.startsWith("/storage/") && backendUrl) {
            absoluteUrl = `${backendUrl}${url}`;
          } else if (backendUrl) {
            absoluteUrl = `${backendUrl}/storage/${filename}`;
          } else {
            absoluteUrl = url;
          }
        }

        console.log("Constructed image URL:", { filename, url, absoluteUrl }); // Debug log

        return {
          filename: filename,
          url: url,
          absoluteUrl: absoluteUrl,
          blurhash: item.blurhash,
          width: item.width,
          height: item.height,
        };
      });
      return mapped;
    } catch (err: any) {
      console.error("Upload error", err?.response?.data || err.message || err);
      const errorMessage = sanitizeErrorMessage(err, {
        action: "upload images",
        defaultMessage: t("add_offer.error_upload_failed")
      });
      toast.error(errorMessage);
      throw err;
    }
  }

  // ✅ Handle image upload
  const handleImage = async (files: File[] | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = await uploadFiles(files);
      setUploadedImages(uploaded);
      setLocalFiles(files);
      // Removed success toast - user can see uploaded images in preview
    } catch (error: any) {
      const errorMessage = sanitizeErrorMessage(error, {
        action: "upload images",
        defaultMessage: t("add_offer.error_upload_failed")
      });
      toast.error(errorMessage);
      // Clear files on error
      setLocalFiles(null);
      setUploadedImages([]);
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (newFiles: File[] | null) => {
    if (!newFiles || newFiles.length === 0) {
      setLocalFiles(null);
      setUploadedImages([]);
      return;
    }
    // Set local files immediately to show preview right away
    setLocalFiles(newFiles);
    // Upload images in the background
    await handleImage(newFiles);
  };

  // ✅ Dropzone config
  const dropzone: DropzoneOptions = {
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    multiple: false,
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  };

  // ✅ Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error(t("add_offer.error_title_required"));
      return;
    }

    // Description is now optional, no validation needed

    const priceToFloat = parseFloat(price);
    if (isNaN(priceToFloat) || priceToFloat <= 0) {
      toast.error(t("add_offer.error_price_required"));
      return;
    }

    const quantityToFloat = parseFloat(quantity);
    if (isNaN(quantityToFloat) || quantityToFloat <= 0) {
      toast.error(t("add_offer.error_quantity_required"));
      return;
    }

    if (!pickupDate) {
      toast.error(t("add_offer.error_date_required"));
      return;
    }

    if (!pickupStartTime) {
      toast.error(t("add_offer.error_start_time_required"));
      return;
    }

    if (!pickupEndTime) {
      toast.error(t("add_offer.error_end_time_required"));
      return;
    }

    // Combine date and times
    const startDateTime = new Date(`${pickupDate}T${pickupStartTime}`);
    const endDateTime = new Date(`${pickupDate}T${pickupEndTime}`);

    if (startDateTime >= endDateTime) {
      toast.error(t("add_offer.error_time_order"));
      return;
    }

    if (endDateTime <= new Date()) {
      toast.error(t("add_offer.error_future_time"));
      return;
    }

    // Pickup location will be taken from user's profile, no need to validate

    try {
      // Ensure images are uploaded before submitting
      if (localFiles && localFiles.length > 0 && uploadedImages.length === 0) {
        // Removed info toast - user can see upload status in UI
        const uploaded = await uploadFiles(localFiles);
        setUploadedImages(uploaded);
      }

      // Format images payload for backend
      // Include all necessary fields for proper image resolution
      const imagesPayload = uploadedImages.length > 0 
        ? uploadedImages.map((img) => ({
            filename: img.filename,
            url: img.url,
            absoluteUrl: img.absoluteUrl,
            // Store the original URL structure for proper resolution
            // If url is a backend storage path, we don't need original.url
            // If url is a local public asset, store it in original.url
            original: img.url.startsWith("/") && !img.url.startsWith("/storage/") 
              ? { url: img.url }
              : undefined,
          }))
        : [];

      // Parse originalPrice - include it if it's a valid positive number
      let originalPriceValue: number | undefined = undefined;
      if (originalPrice && originalPrice.trim() !== "") {
        const parsed = parseFloat(originalPrice.trim());
        if (!isNaN(parsed) && parsed > 0) {
          originalPriceValue = parsed;
        }
      }

      // Use end time as expiration date for backward compatibility
      // Note: pickupLocation will be set from user's profile on the backend
      const payload: any = {
        title: title.trim(),
        description: description.trim() || '', // Allow empty description
        price: priceToFloat,
        quantity: quantityToFloat,
        expirationDate: endDateTime.toISOString(),
        pickupStartTime: startDateTime.toISOString(),
        pickupEndTime: endDateTime.toISOString(),
        foodType: foodType,
        taste: taste,
        images: JSON.stringify(imagesPayload),
      };

      // Only include originalPrice if it has a value (don't send undefined)
      if (originalPriceValue !== undefined) {
        payload.originalPrice = originalPriceValue;
      }

      console.log("Sending payload:", payload); // Debug log

      await axiosInstance.post("/offers", payload);
      toast.success(t("add_offer.success_created"));

      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setQuantity("");
      setPickupDate("");
      setPickupStartTime("");
      setPickupEndTime("");
      setFoodType("other");
      setTaste("neutral");
      setLocalFiles(null);
      setUploadedImages([]);
      
      // Redirect to home after short delay
      setTimeout(() => {
        window.location.href = "/provider/home";
      }, 1500);
    } catch (error: any) {
      console.error("Error submitting offer:", error);
      const errorMessage = sanitizeErrorMessage(error, {
        action: "create offer",
        defaultMessage: t("add_offer.error_create_failed")
      });
      toast.error(errorMessage);
    }
  };

  // ✅ Return JSX
  return (
    <div className="w-full">
      <ToastContainer
        position="top-right"
        autoClose={2000}
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

      {/* Progress Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center mb-4">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all flex-shrink-0 ${
                    step < currentStep
                      ? "bg-emerald-600 text-white"
                      : step === currentStep
                      ? "bg-emerald-500 text-white ring-2 sm:ring-4 ring-emerald-200"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`h-1 flex-1 transition-all ${
                      step < currentStep ? "bg-emerald-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm font-medium text-gray-700">
            {currentStep === 1 && t("add_offer.step_basic_info")}
            {currentStep === 2 && t("add_offer.step_pricing")}
            {currentStep === 3 && t("add_offer.step_availability")}
            {currentStep === 4 && t("add_offer.step_categories")}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t("add_offer.step_progress", { current: currentStep, total: totalSteps })}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-emerald-800">
                💡 {t("add_offer.step1_tip")}
              </p>
            </div>

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.offer_title")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("add_offer.title_placeholder")}
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 text-lg"
                required
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">{t("add_offer.title_hint")}</p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.description")} <span className="text-gray-400 font-normal text-xs">({t("common.optional") || "Optional"})</span>
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("add_offer.description_placeholder")}
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl min-h-[120px] resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length > 0 && `${description.length} characters`}
                {description.length === 0 && t("add_offer.description_hint_no_limit")}
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("add_offer.photos")} <span className="text-gray-400 font-normal">{t("add_offer.photos_optional")}</span>
              </label>
              <FileUploader
                value={localFiles || []}
                onValueChange={handleImageUpload}
                dropzoneOptions={dropzone}
              >
                <FileInput>
                  <div className={`flex flex-col items-center justify-center h-40 w-full border-2 border-dashed rounded-xl transition-colors ${
                    uploading 
                      ? "border-yellow-300 bg-yellow-50 cursor-wait" 
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  }`}>
                    {uploading ? (
                      <>
                        <div className="animate-spin text-4xl mb-2">⏳</div>
                        <p className="text-gray-600 font-medium">{t("add_offer.uploading_images")}</p>
                      </>
                    ) : (
                      <>
                        <div className="text-4xl mb-2">📸</div>
                        <p className="text-gray-600 font-medium">{t("add_offer.click_upload")}</p>
                        <p className="text-xs text-gray-400 mt-1">{t("add_offer.upload_hint")}</p>
                      </>
                    )}
                  </div>
                </FileInput>

                <FileUploaderContent className="flex items-center flex-row gap-3 mt-3 flex-wrap">
                  {localFiles && localFiles.length > 0 && localFiles.map((file, i) => {
                    const uploadedImage = uploadedImages.length > 0 && uploadedImages[i];
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
                      imageSrc = URL.createObjectURL(file) || DEFAULT_BAG_IMAGE;
                    }
                    
                    return (
                      <FileUploaderItem
                        key={`preview-${i}`}
                        index={i}
                        className={`size-24 p-0 rounded-xl overflow-hidden border-2 shadow-sm relative ${
                          isUploaded ? "border-emerald-600" : "border-yellow-400"
                        }`}
                        aria-roledescription={`File ${i + 1} containing ${file.name}`}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <Image
                            src={imageSrc || DEFAULT_BAG_IMAGE}
                            alt={file.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover rounded-xl"
                            unoptimized={true}
                          />
                        </div>
                        <div className={`absolute top-1 right-1 text-white text-xs px-1.5 py-0.5 rounded-full z-10 ${
                          isUploaded 
                            ? "bg-emerald-600" 
                            : uploading 
                            ? "bg-yellow-500" 
                            : "bg-yellow-400"
                        }`}>
                          {isUploaded ? "✓" : uploading ? "⏳" : "📤"}
                        </div>
                      </FileUploaderItem>
                    );
                  })}
                </FileUploaderContent>
              </FileUploader>
              <div className="mt-2 flex items-center gap-2 text-xs">
                {uploadedImages.length > 0 && (
                  <span className="text-emerald-600 font-medium">
                    {t("add_offer.images_uploaded", { count: uploadedImages.length, plural: uploadedImages.length > 1 ? "s" : "" })}
                  </span>
                )}
                {localFiles && localFiles.length > uploadedImages.length && (
                  <span className="text-yellow-600 font-medium">
                    {t("add_offer.pending_upload", { count: localFiles.length - uploadedImages.length })}
                  </span>
                )}
                {uploadedImages.length === 0 && localFiles?.length === 0 && (
                  <span className="text-gray-500">{t("add_offer.photos_tip")}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800">
                💰 {t("add_offer.step2_tip")}
              </p>
            </div>

            {/* Current Price */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.your_price")} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) setPrice(value);
                  }}
                  placeholder={t("add_offer.price_placeholder")}
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 pr-12 text-lg"
                  required
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">dt</span>
              </div>
              {price && !isNaN(parseFloat(price)) && parseFloat(price) > 0 && (
                <p className="text-xs text-blue-600 mt-1 bg-blue-50 p-2 rounded border border-blue-200">
                  {t("add_offer.commission_notice", { 
                    price: parseFloat(price).toFixed(2), 
                    finalPrice: (parseFloat(price) + 1).toFixed(2) 
                  })}
                </p>
              )}
            </div>

            {/* Original Price (Optional) */}
            <div>
              <label
                htmlFor="originalPrice"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.original_price")} <span className="text-gray-400 font-normal text-xs">{t("add_offer.original_price_optional")}</span>
              </label>
              <div className="relative">
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) setOriginalPrice(value);
                  }}
                  placeholder={t("add_offer.original_price_placeholder")}
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">dt</span>
              </div>
              {originalPrice && parseFloat(originalPrice) > parseFloat(price || "0") && (
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  {t("add_offer.save_percentage", { percentage: ((1 - parseFloat(price || "0") / parseFloat(originalPrice)) * 100).toFixed(0) })}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">{t("add_offer.original_price_hint")}</p>
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.available_quantity")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) setQuantity(value);
                }}
                placeholder={t("add_offer.quantity_placeholder")}
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 text-lg"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{t("add_offer.quantity_hint")}</p>
            </div>
          </div>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-amber-800">
                ⏰ {t("add_offer.step3_tip")}
              </p>
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
                    {t("add_offer.pickup_location_hint")}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Time Presets */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("add_offer.quick_presets")} <span className="text-gray-400 font-normal text-xs">({t("common.optional") || "Optional"})</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyTimePreset('today-afternoon')}
                  className="text-xs sm:text-sm py-2 h-auto whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t("add_offer.preset_today_afternoon")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyTimePreset('today-evening')}
                  className="text-xs sm:text-sm py-2 h-auto whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t("add_offer.preset_today_evening")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyTimePreset('tomorrow-morning')}
                  className="text-xs sm:text-sm py-2 h-auto whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t("add_offer.preset_tomorrow_morning")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => applyTimePreset('tomorrow-afternoon')}
                  className="text-xs sm:text-sm py-2 h-auto whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  {t("add_offer.preset_tomorrow_afternoon")}
                </Button>
              </div>
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
                {t("add_offer.pickup_location_hint")}
              </p>
            </div>
          </div>
        </div>

            {/* Pickup Date and Time Range */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="pickupDate"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {t("add_offer.pickup_date")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 text-lg"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">{t("add_offer.pickup_date_hint")}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="pickupStartTime"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    {t("add_offer.start_time")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="pickupStartTime"
                    type="time"
                    value={pickupStartTime}
                    onChange={(e) => setPickupStartTime(e.target.value)}
                    className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("add_offer.start_time_hint")}</p>
                </div>

                <div>
                  <label
                    htmlFor="pickupEndTime"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    {t("add_offer.end_time")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="pickupEndTime"
                    type="time"
                    value={pickupEndTime}
                    onChange={(e) => setPickupEndTime(e.target.value)}
                    min={pickupStartTime || undefined}
                    className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">{t("add_offer.end_time_hint")}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Categories */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-purple-800">
                🏷️ {t("add_offer.step4_tip")}
              </p>
            </div>

            {/* Category Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Food Type */}
              <div>
                <label
                  htmlFor="foodType"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {t("add_offer.food_type_label")}
                </label>
                <select
                  id="foodType"
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value as FoodType)}
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl text-sm sm:text-base bg-white"
                  autoFocus
                >
                  <option value="snack">{t("add_offer.food_type_snack")}</option>
                  <option value="meal">{t("add_offer.food_type_meal")}</option>
                  <option value="beverage">{t("add_offer.food_type_beverage")}</option>
                  <option value="other">{t("add_offer.food_type_other")}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t("add_offer.food_type_hint")}</p>
              </div>

              {/* Taste */}
              <div>
                <label
                  htmlFor="taste"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {t("add_offer.taste_label")}
                </label>
                <select
                  id="taste"
                  value={taste}
                  onChange={(e) => setTaste(e.target.value as Taste)}
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl text-sm sm:text-base bg-white"
                >
                  <option value="sweet">{t("add_offer.taste_sweet")}</option>
                  <option value="salty">{t("add_offer.taste_salty")}</option>
                  <option value="both">{t("add_offer.taste_both")}</option>
                  <option value="neutral">{t("add_offer.taste_neutral")}</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">{t("add_offer.taste_hint")}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-2 sm:gap-3 pt-6 border-t border-gray-200">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex-1 flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base min-w-0"
            >
              <ChevronLeft className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("add_offer.previous")}</span>
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base min-w-0"
            >
              <span className="truncate">{t("add_offer.next")}</span>
              <ChevronRight className="w-4 h-4 flex-shrink-0" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!title.trim() || !price || !quantity || !pickupDate || !pickupStartTime || !pickupEndTime}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base min-w-0"
            >
              <Check className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{t("add_offer.create_button")}</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddOffer;