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
import { DropzoneOptions } from "react-dropzone";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { compressImages, shouldCompress } from "@/utils/imageCompression";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useBlobUrl } from "@/hooks/useBlobUrl";

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
  const { createBlobUrl, revokeBlobUrl } = useBlobUrl();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupStartTime, setPickupStartTime] = useState("");
  const [pickupEndTime, setPickupEndTime] = useState("");
  // Pickup location is now taken from user's profile, no need for state
  const [foodType, setFoodType] = useState<FoodType | "">("");
  const [taste, setTaste] = useState<Taste | "">("");
  
  // Auto-fill smart defaults on mount
  useEffect(() => {
    // Set default pickup time to today afternoon if not set
    if (!pickupDate && !pickupStartTime && !pickupEndTime) {
      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const formatTime = (hours: number, minutes: number = 0) => 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      setPickupDate(formatDate(today));
      setPickupStartTime(formatTime(14, 0)); // 2:00 PM
      setPickupEndTime(formatTime(18, 0)); // 6:00 PM
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount
  const [localFiles, setLocalFiles] = useState<File[] | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const blobUrlMapRef = React.useRef<Map<File, string>>(new Map());
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
      case 4: // Categories - ensure foodType and taste are selected
        return foodType !== "" && foodType !== undefined && foodType !== null && 
               taste !== "" && taste !== undefined && taste !== null;
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
        const url = item.url || `/store/${filename}`;
        
        // Build absoluteUrl - if backend returns a full URL, use it; otherwise construct it
        let absoluteUrl = item.absoluteUrl;
        if (!absoluteUrl) {
          if (url.startsWith("http://") || url.startsWith("https://")) {
            absoluteUrl = url;
          } else if (url.startsWith("/store/") && backendUrl) {
            absoluteUrl = `${backendUrl}${url}`;
          } else if (url.startsWith("/storage/") && backendUrl) {
            // Legacy support: convert /storage/ to /store/
            const storePath = url.replace("/storage/", "/store/");
            absoluteUrl = `${backendUrl}${storePath}`;
          } else if (backendUrl) {
            absoluteUrl = `${backendUrl}/store/${filename}`;
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
      // Once uploaded, we can keep the blob URLs for preview until component unmounts
      // The hook will clean them up automatically
      // Removed success toast - user can see uploaded images in preview
    } catch (error: any) {
      // Clear files on error and revoke blob URLs
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
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (newFiles: File[] | null) => {
    if (!newFiles || newFiles.length === 0) {
      // Revoke any existing blob URLs before clearing
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
      return;
    }

    // Description is now optional, no validation needed

    const priceToFloat = parseFloat(price);
    if (isNaN(priceToFloat) || priceToFloat <= 0) {
      return;
    }

    const quantityToFloat = parseFloat(quantity);
    if (isNaN(quantityToFloat) || quantityToFloat <= 0) {
      return;
    }

    if (!pickupDate) {
      return;
    }

    if (!pickupStartTime) {
      return;
    }

    if (!pickupEndTime) {
      return;
    }

    // Combine date and times
    const startDateTime = new Date(`${pickupDate}T${pickupStartTime}`);
    const endDateTime = new Date(`${pickupDate}T${pickupEndTime}`);

    if (startDateTime >= endDateTime) {
      return;
    }

    if (endDateTime <= new Date()) {
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
            original: img.url.startsWith("/") && !img.url.startsWith("/store/") && !img.url.startsWith("/storage/") 
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
        foodType: foodType as FoodType,
        taste: taste as Taste,
        images: JSON.stringify(imagesPayload),
      };

      // Only include originalPrice if it has a value (don't send undefined)
      if (originalPriceValue !== undefined) {
        payload.originalPrice = originalPriceValue;
      }

      console.log("Sending payload:", payload); // Debug log

      await axiosInstance.post("/offers", payload);

      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setOriginalPrice("");
      setQuantity("");
      setPickupDate("");
      setPickupStartTime("");
      setPickupEndTime("");
      setFoodType("");
      setTaste("");
      setLocalFiles(null);
      setUploadedImages([]);
      
      // Redirect to home immediately
      window.location.href = "/provider/home";
    } catch (error: any) {
      console.error("Error submitting offer:", error);
    }
  };

  // ✅ Return JSX
  return (
    <div className="w-full flex flex-col">
      {/* Progress Indicator */}
      <div className="mb-3 sm:mb-4">
        <div className="flex items-center mb-2 sm:mb-3">
          {[1, 2, 3, 4].map((step) => (
            <React.Fragment key={step}>
              <div className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1 relative">
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm transition-all flex-shrink-0 relative z-10 ${
                      step < currentStep
                        ? "bg-emerald-600 text-white"
                        : step === currentStep
                        ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step < currentStep ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" /> : step}
                  </div>
                  {/* Step Label - Only show for current step */}
                  {step === currentStep && (
                    <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-center text-emerald-600 font-semibold transition-colors px-1">
                      {step === 1 && t("add_offer.step_basic_info")}
                      {step === 2 && t("add_offer.step_pricing")}
                      {step === 3 && t("add_offer.step_availability")}
                      {step === 4 && t("add_offer.step_categories")}
                    </div>
                  )}
                  {step !== currentStep && (
                    <div className="mt-1.5 sm:mt-2 h-[16px] sm:h-[18px]"></div>
                  )}
                </div>
                {step < totalSteps && (
                  <div className="flex-1 mx-1 sm:mx-1.5 flex items-center">
                    <div
                      className={`h-1 w-full transition-all ${
                        step < currentStep ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    />
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="pr-1 sm:pr-2">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">{t("add_offer.step_basic_info")}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{t("add_offer.step1_tip")}</p>
            </div>
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.offer_title")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("add_offer.title_placeholder")}
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-sm sm:text-base"
                required
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.description")} <span className="text-gray-400 font-normal text-xs sm:text-sm">({t("common.optional") || "Optional"})</span>
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("add_offer.description_placeholder")}
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl min-h-[100px] sm:min-h-[120px] resize-none text-sm sm:text-base"
              />
            </div>

            {/* Image Upload */}
            <div className="mt-2">
              <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">
                {t("add_offer.photos")} <span className="text-gray-400 font-normal text-xs sm:text-sm">({t("common.optional") || "Optional"})</span>
              </label>
              <FileUploader
                value={localFiles || []}
                onValueChange={handleImageUpload}
                dropzoneOptions={dropzone}
              >
                <FileInput>
                  <div className={`flex flex-col items-center justify-center h-28 sm:h-32 w-full border-2 border-dashed rounded-lg sm:rounded-xl transition-colors ${
                    uploading 
                      ? "border-yellow-300 bg-yellow-50 cursor-wait" 
                      : "border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  }`}>
                    {uploading ? (
                      <>
                        <div className="animate-spin text-2xl sm:text-3xl mb-1">⏳</div>
                        <p className="text-gray-600 text-xs sm:text-sm">{t("add_offer.uploading_images")}</p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl sm:text-3xl mb-1">📸</div>
                        <p className="text-gray-600 text-xs sm:text-sm">{t("add_offer.click_upload")}</p>
                      </>
                    )}
                  </div>
                </FileInput>

                <FileUploaderContent className="flex items-center flex-row gap-3 mt-2 flex-wrap">
                  {localFiles && localFiles.length > 0 && localFiles.map((file, i) => {
                    const uploadedImage = uploadedImages.length > 0 && uploadedImages[i];
                    const isUploaded = !!uploadedImage;
                    
                    let imageSrc: string;
                    if (isUploaded && uploadedImage) {
                      imageSrc = uploadedImage.absoluteUrl || uploadedImage.url || "";
                      
                      if (imageSrc && !imageSrc.startsWith("http") && !imageSrc.startsWith("/")) {
                        const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                        imageSrc = `${backendUrl}/store/${imageSrc}`;
                      } else if (imageSrc && imageSrc.startsWith("/store/")) {
                        const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                        imageSrc = `${backendUrl}${imageSrc}`;
                      } else if (imageSrc && imageSrc.startsWith("/storage/")) {
                        // Legacy support: convert /storage/ to /store/
                        const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                        const storePath = imageSrc.replace("/storage/", "/store/");
                        imageSrc = `${backendUrl}${storePath}`;
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
                      imageSrc = blobUrl || DEFAULT_BAG_IMAGE;
                    }
                    
                    return (
                      <FileUploaderItem
                        key={`preview-${i}`}
                        index={i}
                        className={`size-16 sm:size-20 p-0 rounded-lg overflow-hidden border-2 shadow-sm relative ${
                          isUploaded ? "border-emerald-600" : "border-yellow-400"
                        }`}
                        aria-roledescription={`File ${i + 1} containing ${file.name}`}
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          <Image
                            src={imageSrc || DEFAULT_BAG_IMAGE}
                            alt={file.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover rounded-lg"
                            unoptimized={true}
                          />
                        </div>
                        <div className={`absolute top-0.5 right-0.5 text-white text-[10px] px-1 py-0.5 rounded-full z-10 ${
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
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {currentStep === 2 && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">{t("add_offer.step_pricing")}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{t("add_offer.step2_tip")}</p>
            </div>
            {/* Current Price */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
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
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base"
                  required
                  autoFocus
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">dt</span>
              </div>
            </div>

            {/* Original Price (Optional) */}
            <div>
              <label
                htmlFor="originalPrice"
                className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
              >
                {t("add_offer.original_price")} <span className="text-gray-400 font-normal text-xs sm:text-sm">({t("common.optional") || "Optional"})</span>
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
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl py-2.5 sm:py-3 pr-10 sm:pr-12 text-sm sm:text-base"
                />
                <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm">dt</span>
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
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
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-sm sm:text-base"
                required
              />
            </div>
          </div>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">{t("add_offer.step_availability")}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{t("add_offer.step3_tip")}</p>
            </div>
            {/* Quick Time Presets */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
              <label className="block text-xs sm:text-sm font-semibold text-emerald-900 mb-3">
                ⚡ {t("add_offer.quick_presets")}
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                <Button
                  type="button"
                  onClick={() => applyTimePreset('today-afternoon')}
                  className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-medium text-xs sm:text-sm py-2.5 sm:py-3 h-auto transition-all"
                >
                  {t("add_offer.preset_today_afternoon")}
                </Button>
                <Button
                  type="button"
                  onClick={() => applyTimePreset('today-evening')}
                  className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-medium text-xs sm:text-sm py-2.5 sm:py-3 h-auto transition-all"
                >
                  {t("add_offer.preset_today_evening")}
                </Button>
                <Button
                  type="button"
                  onClick={() => applyTimePreset('tomorrow-morning')}
                  className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-medium text-xs sm:text-sm py-2.5 sm:py-3 h-auto transition-all"
                >
                  {t("add_offer.preset_tomorrow_morning")}
                </Button>
                <Button
                  type="button"
                  onClick={() => applyTimePreset('tomorrow-afternoon')}
                  className="bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-medium text-xs sm:text-sm py-2.5 sm:py-3 h-auto transition-all"
                >
                  {t("add_offer.preset_tomorrow_afternoon")}
                </Button>
              </div>
            </div>

            {/* Pickup Date and Time Range */}
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label
                  htmlFor="pickupDate"
                  className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
                >
                  {t("add_offer.pickup_date")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-sm sm:text-base"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label
                    htmlFor="pickupStartTime"
                    className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
                  >
                    {t("add_offer.start_time")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="pickupStartTime"
                    type="time"
                    value={pickupStartTime}
                    onChange={(e) => setPickupStartTime(e.target.value)}
                    className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="pickupEndTime"
                    className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
                  >
                    {t("add_offer.end_time")} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="pickupEndTime"
                    type="time"
                    value={pickupEndTime}
                    onChange={(e) => setPickupEndTime(e.target.value)}
                    min={pickupStartTime || undefined}
                    className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl py-2.5 sm:py-3 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Categories */}
        {currentStep === 4 && (
          <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            <div className="mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-gray-200">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">{t("add_offer.step_categories")}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{t("add_offer.step4_tip")}</p>
            </div>
            {/* Category Fields */}
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {/* Food Type */}
              <div>
                <label
                  htmlFor="foodType"
                  className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
                >
                  {t("add_offer.food_type_label")} <span className="text-red-500">*</span>
                </label>
                <select
                  id="foodType"
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value as FoodType)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl text-sm sm:text-base bg-white"
                  autoFocus
                  required
                >
                  <option value="" disabled>{t("add_offer.select_food_type")}</option>
                  <option value="snack">{t("add_offer.food_type_snack")}</option>
                  <option value="meal">{t("add_offer.food_type_meal")}</option>
                  <option value="beverage">{t("add_offer.food_type_beverage")}</option>
                  <option value="other">{t("add_offer.food_type_other")}</option>
                </select>
              </div>

              {/* Taste */}
              <div>
                <label
                  htmlFor="taste"
                  className="block text-sm sm:text-base font-semibold text-gray-700 mb-2"
                >
                  {t("add_offer.taste_label")} <span className="text-red-500">*</span>
                </label>
                <select
                  id="taste"
                  value={taste}
                  onChange={(e) => setTaste(e.target.value as Taste)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-lg sm:rounded-xl text-sm sm:text-base bg-white"
                  required
                >
                  <option value="" disabled>{t("add_offer.select_taste")}</option>
                  <option value="sweet">{t("add_offer.taste_sweet")}</option>
                  <option value="salty">{t("add_offer.taste_salty")}</option>
                  <option value="both">{t("add_offer.taste_both")}</option>
                  <option value="neutral">{t("add_offer.taste_neutral")}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        </div>
        {/* Navigation Buttons */}
        <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 pb-2 sm:pb-3 border-t border-gray-200 bg-white mt-4 sm:mt-6">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm sm:text-base min-w-0 py-3 sm:py-3.5"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">{t("add_offer.previous")}</span>
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-1.5 text-sm sm:text-base min-w-0 py-3 sm:py-3.5"
            >
              <span className="truncate">{t("add_offer.next")}</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!title.trim() || !price || !quantity || !pickupDate || !pickupStartTime || !pickupEndTime || !foodType || !taste || !canProceedToNextStep()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-1.5 text-sm sm:text-base min-w-0 py-3 sm:py-3.5"
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="truncate">{t("add_offer.create_button")}</span>
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddOffer;