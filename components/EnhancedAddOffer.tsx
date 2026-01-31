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
import React, { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { compressImages, shouldCompress } from "@/utils/imageCompression";
import { 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Upload, 
  Camera, 
  Clock, 
  Calendar,
  DollarSign,
  Package,
  Utensils,
  Coffee,
  Cookie,
  MoreHorizontal,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useBlobUrl } from "@/hooks/useBlobUrl";
import { getBackendOrigin } from "@/lib/backendOrigin";
import { toast } from "react-hot-toast";

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

const EnhancedAddOffer: React.FC = () => {
  const { t } = useLanguage();
  const { createBlobUrl, revokeBlobUrl } = useBlobUrl();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const formRef = useRef<HTMLFormElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupStartTime, setPickupStartTime] = useState("");
  const [pickupEndTime, setPickupEndTime] = useState("");
  const [foodType, setFoodType] = useState<FoodType | "">("");
  const [taste, setTaste] = useState<Taste | "">("");
  
  const [localFiles, setLocalFiles] = useState<File[] | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const blobUrlMapRef = React.useRef<Map<File, string>>(new Map());

  // Auto-fill smart defaults on mount
  useEffect(() => {
    if (!pickupDate && !pickupStartTime && !pickupEndTime) {
      const today = new Date();
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      const formatTime = (hours: number, minutes: number = 0) => 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      setPickupDate(formatDate(today));
      setPickupStartTime(formatTime(14, 0)); // 2:00 PM
      setPickupEndTime(formatTime(18, 0)); // 6:00 PM
    }
    
    // Mark as initialized
    setIsInitialized(true);
  }, []); // Only run once on mount

  // Quick time presets with better UX
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
        setPickupStartTime(formatTime(14, 0));
        setPickupEndTime(formatTime(18, 0));
        break;
      case 'today-evening':
        setPickupDate(formatDate(today));
        setPickupStartTime(formatTime(17, 0));
        setPickupEndTime(formatTime(20, 0));
        break;
      case 'tomorrow-morning':
        setPickupDate(formatDate(tomorrow));
        setPickupStartTime(formatTime(10, 0));
        setPickupEndTime(formatTime(14, 0));
        break;
      case 'tomorrow-afternoon':
        setPickupDate(formatDate(tomorrow));
        setPickupStartTime(formatTime(14, 0));
        setPickupEndTime(formatTime(18, 0));
        break;
    }
  };

  // Enhanced step validation with better feedback
  const validateStep = (step: number): { valid: boolean; message?: string } => {
    switch (step) {
      case 1:
        if (title.trim().length === 0) {
          return { valid: false, message: t("add_offer.validation_title_required") };
        }
        if (title.trim().length < 3) {
          return { valid: false, message: t("add_offer.validation_title_min_length") };
        }
        return { valid: true };
      case 2:
        const priceToFloat = parseFloat(price);
        const quantityToFloat = parseFloat(quantity);
        if (!price || isNaN(priceToFloat) || priceToFloat <= 0) {
          return { valid: false, message: t("add_offer.validation_price_required") };
        }
        if (!quantity || isNaN(quantityToFloat) || quantityToFloat <= 0) {
          return { valid: false, message: t("add_offer.validation_quantity_required") };
        }
        return { valid: true };
      case 3:
        if (!pickupDate || !pickupStartTime || !pickupEndTime) {
          return { valid: false, message: t("add_offer.validation_all_fields_required") };
        }
        const startDateTime = new Date(`${pickupDate}T${pickupStartTime}`);
        const endDateTime = new Date(`${pickupDate}T${pickupEndTime}`);
        if (startDateTime >= endDateTime) {
          return { valid: false, message: t("add_offer.validation_time_order") };
        }
        if (endDateTime <= new Date()) {
          return { valid: false, message: t("add_offer.validation_future_time") };
        }
        return { valid: true };
      case 4:
        if (!foodType) {
          return { valid: false, message: t("add_offer.validation_food_type_required") };
        }
        if (!taste) {
          return { valid: false, message: t("add_offer.validation_taste_required") };
        }
        return { valid: true };
      default:
        return { valid: false };
    }
  };

  const canProceedToNextStep = (): boolean => {
    return validateStep(currentStep).valid;
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

  // Enhanced image upload with better feedback
  async function uploadFiles(files: File[]): Promise<UploadedImage[]> {
    if (!files || files.length === 0) return [];

    let filesToUpload = files;
    const needsCompression = files.some((f) => shouldCompress(f, 1));
    
    if (needsCompression) {
      try {
        filesToUpload = await compressImages(files, {
          maxWidth: 1200, // Reduced from 1500 for faster upload
          maxHeight: 1200,
          quality: 0.8, // Reduced from 0.85 for faster upload
          maxSizeMB: 0.8, // Reduced from 1MB for faster upload
        });
      } catch (error) {
        console.error("Compression error:", error);
        filesToUpload = files;
      }
    }

    const fd = new FormData();
    filesToUpload.forEach((f) => fd.append("files", f));

    try {
      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 20000, // Reduced from 30 seconds
      });

      const data = res.data as any[];
      const mapped: UploadedImage[] = data.map((item) => {
        const filename = item.filename || item.path || "";
        const url = item.url || `/storage/${filename}`;
        const absoluteUrl = item.absoluteUrl || `${getBackendOrigin()}${url}`;
        
        return {
          filename,
          url,
          absoluteUrl,
          blurhash: item.blurhash,
          width: item.width,
          height: item.height,
        };
      });

      return mapped;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  }

  const handleImageUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      setLocalFiles(null);
      setUploadedImages([]);
      return;
    }

    setLocalFiles(files);
    setUploading(true);

    try {
      const uploaded = await uploadFiles(files);
      setUploadedImages(uploaded);
      toast.success(t("add_offer.upload_success"));
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(t("add_offer.upload_failed"));
      setLocalFiles(null);
    } finally {
      setUploading(false);
    }
  };

  const dropzone: DropzoneOptions = {
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    multiple: true,
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024,
  };

  // Enhanced form submission with better feedback
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canProceedToNextStep()) {
      const validation = validateStep(currentStep);
      toast.error(validation.message || t("add_offer.validation_complete_fields"));
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("add_offer.login_required"));
        return;
      }

      // Prepare images payload
      let imagesPayload: any = undefined;
      if (uploadedImages.length > 0) {
        imagesPayload = JSON.stringify(
          uploadedImages.map((img) => ({
            filename: img.filename,
            url: img.url,
            absoluteUrl: img.absoluteUrl,
            original: img.url.startsWith("/") && !img.url.startsWith("/storage/") && !img.url.startsWith("/store/")
              ? { url: img.url }
              : undefined,
          }))
        );
      }

      // Convert date and time to proper ISO format
      const startDateTime = new Date(`${pickupDate}T${pickupStartTime}:00`);
      const endDateTime = new Date(`${pickupDate}T${pickupEndTime}:00`);
      
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        quantity: parseInt(quantity, 10),
        expirationDate: endDateTime.toISOString(),
        pickupStartTime: startDateTime.toISOString(),
        pickupEndTime: endDateTime.toISOString(),
        foodType: foodType || undefined,
        taste: taste || undefined,
        images: imagesPayload,
      };

      console.log("Submitting offer payload:", payload);

      const response = await axiosInstance.post("/offers", payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000, // Reduced timeout for better UX
      });

      toast.success(t("add_offer.create_success"));
      
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
      
      // Redirect to home
      setTimeout(() => {
        window.location.href = "/provider/home";
      }, 1500);
      
    } catch (error: any) {
      console.error("Error submitting offer:", error);
      toast.error(error?.response?.data?.message || t("add_offer.create_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Get food type icon
  const getFoodTypeIcon = (type: FoodType) => {
    switch (type) {
      case "meal": return Utensils;
      case "beverage": return Coffee;
      case "snack": return Cookie;
      case "other": return MoreHorizontal;
      default: return Package;
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="w-full max-w-4xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 rounded-lg mb-8"></div>
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="h-6 bg-gray-200 rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!isInitialized ? (
        <LoadingSkeleton />
      ) : (
        <div className="w-full max-w-4xl mx-auto">
      {/* Enhanced Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => {
            const isActive = step === currentStep;
            const isCompleted = step < currentStep;
            
            return (
              <div key={step} className="flex items-center flex-1 relative">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 relative z-10 ${
                      isCompleted
                        ? "bg-emerald-600 text-white shadow-lg"
                        : isActive
                        ? "bg-emerald-500 text-white ring-4 ring-emerald-200 shadow-lg"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-6 h-6" />
                    ) : (
                      <span className="text-lg">{step}</span>
                    )}
                  </div>
                  <div className={`mt-3 text-center transition-colors ${
                    isActive ? "text-emerald-600 font-semibold" : isCompleted ? "text-emerald-500" : "text-gray-500"
                  }`}>
                    <div className="text-xs font-medium">
                      {step === 1 && t("add_offer.step_basic_info")}
                      {step === 2 && t("add_offer.step_pricing")}
                      {step === 3 && t("add_offer.step_availability")}
                      {step === 4 && t("add_offer.step_categories")}
                    </div>
                  </div>
                </div>
                {step < totalSteps && (
                  <div className="flex-1 mx-2 flex items-center">
                    <div
                      className={`h-1 w-full transition-all duration-300 ${
                        isCompleted ? "bg-emerald-600" : "bg-gray-200"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t("add_offer.step1_subtitle")}</h2>
              <p className="text-sm sm:text-base text-gray-600 px-4">{t("add_offer.step1_description")}</p>
            </div>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.offer_title")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("add_offer.title_placeholder")}
                  className="text-base sm:text-lg py-2.5 sm:py-3 border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
                  required
                  maxLength={100}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.description")} <span className="text-gray-400 font-normal text-xs sm:text-sm">({t("common.optional") || "Optional"})</span>
                </label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("add_offer.description_placeholder")}
                  className="min-h-[100px] sm:min-h-[120px] text-base sm:text-lg border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Enhanced Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.photos")} <span className="text-gray-400 font-normal text-xs sm:text-sm">({t("common.optional") || "Optional"})</span>
                </label>
                <FileUploader
                  value={localFiles || []}
                  onValueChange={handleImageUpload}
                  dropzoneOptions={dropzone}
                >
                  <FileInput>
                    <div className={`flex flex-col items-center justify-center h-32 sm:h-40 w-full border-2 border-dashed rounded-2xl transition-all ${
                      uploading 
                        ? "border-yellow-400 bg-yellow-50 cursor-wait" 
                        : "border-gray-300 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 cursor-pointer"
                    }`}>
                      {uploading ? (
                        <>
                          <div className="animate-spin text-2xl sm:text-3xl mb-2">⏳</div>
                          <p className="text-gray-600 text-sm sm:text-base font-medium">{t("add_offer.uploading_images")}</p>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                          </div>
                          <p className="text-gray-700 font-medium mb-1 text-sm sm:text-base">{t("add_offer.upload_photos_text")}</p>
                          <p className="text-gray-500 text-xs sm:text-sm">{t("add_offer.upload_drag_text")}</p>
                          <p className="text-gray-400 text-xs sm:text-xs mt-1">{t("add_offer.upload_hint_text")}</p>
                        </>
                      )}
                    </div>
                  </FileInput>

                  <FileUploaderContent className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    {localFiles && localFiles.map((file, i) => {
                      const uploadedImage = uploadedImages[i];
                      const isUploaded = !!uploadedImage;
                      
                      let imageSrc: string;
                      if (isUploaded && uploadedImage) {
                        imageSrc = uploadedImage.absoluteUrl || uploadedImage.url || "";
                        if (imageSrc && !imageSrc.startsWith("http") && !imageSrc.startsWith("/")) {
                          const backendUrl = getBackendOrigin();
                          imageSrc = `${backendUrl}/store/${imageSrc}`;
                        }
                      } else {
                        let blobUrl = blobUrlMapRef.current.get(file);
                        if (!blobUrl) {
                          const newBlobUrl = createBlobUrl(file);
                          if (newBlobUrl) {
                            blobUrlMapRef.current.set(file, newBlobUrl);
                            blobUrl = newBlobUrl;
                          }
                        }
                        imageSrc = blobUrl || DEFAULT_BAG_IMAGE;
                      }
                      
                      return (
                        <FileUploaderItem
                          key={`preview-${i}`}
                          index={i}
                          className={`aspect-square p-0 rounded-xl overflow-hidden border-2 shadow-sm relative ${
                            isUploaded ? "border-emerald-500" : "border-yellow-400"
                          }`}
                        >
                          <div className="w-full h-full relative">
                            <Image
                              src={imageSrc || DEFAULT_BAG_IMAGE}
                              alt={file.name}
                              fill
                              className="object-cover"
                              unoptimized={true}
                            />
                            <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs ${
                              isUploaded ? "bg-emerald-500" : "bg-yellow-400"
                            }`}>
                              {isUploaded ? <Check className="w-3 h-3" /> : <Upload className="w-3 h-3" />}
                            </div>
                          </div>
                        </FileUploaderItem>
                      );
                    })}
                  </FileUploaderContent>
                </FileUploader>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t("add_offer.step2_subtitle")}</h2>
              <p className="text-sm sm:text-base text-gray-600 px-4">{t("add_offer.step2_description")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Price */}
              <div>
                <label htmlFor="price" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.sale_price")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm sm:text-base sm:text-lg">dt</span>
                  </div>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 sm:pl-12 text-base sm:text-lg py-2.5 sm:py-3 border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
                    required
                    min="0.01"
                    step="0.01"
                    autoFocus
                  />
                </div>
              </div>

              {/* Original Price */}
              <div>
                <label htmlFor="originalPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.original_price_label")} <span className="text-gray-400 font-normal text-xs sm:text-sm">({t("common.optional") || "Optional"})</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm sm:text-base sm:text-lg">dt</span>
                  </div>
                  <Input
                    id="originalPrice"
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    placeholder="0.00"
                    className="pl-10 sm:pl-12 text-base sm:text-lg py-2.5 sm:py-3 border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
                    min="0.01"
                    step="0.01"
                  />
                </div>
                {originalPrice && parseFloat(originalPrice) > parseFloat(price) && (
                  <p className="text-xs sm:text-sm text-emerald-600 mt-1">
                    {t("add_offer.save_percentage").replace('{percentage}', Math.round((1 - parseFloat(price) / parseFloat(originalPrice)) * 100).toString())}
                  </p>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.quantity_available")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                  className="text-base sm:text-lg py-2.5 sm:py-3 border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
                  required
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Availability */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t("add_offer.step3_subtitle")}</h2>
              <p className="text-sm sm:text-base text-gray-600 px-4">{t("add_offer.step3_description")}</p>
            </div>

            {/* Quick Time Presets */}
            <div className="bg-emerald-50 rounded-xl p-3 sm:p-4">
              <p className="text-sm font-semibold text-emerald-700 mb-2 sm:mb-3">{t("add_offer.quick_presets")}:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyTimePreset('today-afternoon')}
                  className="px-2 sm:px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs sm:text-sm hover:bg-emerald-100 transition-colors"
                >
                  {t("add_offer.preset_today_afternoon")}
                </button>
                <button
                  type="button"
                  onClick={() => applyTimePreset('today-evening')}
                  className="px-2 sm:px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs sm:text-sm hover:bg-emerald-100 transition-colors"
                >
                  {t("add_offer.preset_today_evening")}
                </button>
                <button
                  type="button"
                  onClick={() => applyTimePreset('tomorrow-morning')}
                  className="px-2 sm:px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs sm:text-sm hover:bg-emerald-100 transition-colors"
                >
                  {t("add_offer.preset_tomorrow_morning")}
                </button>
                <button
                  type="button"
                  onClick={() => applyTimePreset('tomorrow-afternoon')}
                  className="px-2 sm:px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs sm:text-sm hover:bg-emerald-100 transition-colors"
                >
                  {t("add_offer.preset_tomorrow_afternoon")}
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Date */}
              <div>
                <label htmlFor="pickupDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.pickup_date_label")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="text-base sm:text-lg py-2.5 sm:py-3 border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Start Time */}
              <div>
                <label htmlFor="pickupStartTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.start_time_label")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pickupStartTime"
                  type="time"
                  value={pickupStartTime}
                  onChange={(e) => setPickupStartTime(e.target.value)}
                  className="text-base sm:text-lg py-2.5 sm:py-3 border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
                  required
                />
              </div>

              {/* End Time */}
              <div>
                <label htmlFor="pickupEndTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  {t("add_offer.end_time_label")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pickupEndTime"
                  type="time"
                  value={pickupEndTime}
                  onChange={(e) => setPickupEndTime(e.target.value)}
                  min={pickupStartTime || undefined}
                  className="text-base sm:text-lg py-2.5 sm:py-3 border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl"
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Categories */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{t("add_offer.step4_subtitle")}</h2>
              <p className="text-sm sm:text-base text-gray-600 px-4">{t("add_offer.step4_description")}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Food Type */}
              <div>
                <label htmlFor="foodType" className="block text-sm font-semibold text-gray-700 mb-2">
                  Food Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="foodType"
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value as FoodType)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl bg-white"
                  required
                  autoFocus
                >
                  <option value="" disabled>{t("add_offer.select_food_type_label")}</option>
                  <option value="meal">{t("add_offer.food_type_meal")}</option>
                  <option value="snack">{t("add_offer.food_type_snack")}</option>
                  <option value="beverage">{t("add_offer.food_type_beverage")}</option>
                  <option value="other">{t("add_offer.food_type_other")}</option>
                </select>
              </div>

              {/* Taste */}
              <div>
                <label htmlFor="taste" className="block text-sm font-semibold text-gray-700 mb-2">
                  Taste Profile <span className="text-red-500">*</span>
                </label>
                <select
                  id="taste"
                  value={taste}
                  onChange={(e) => setTaste(e.target.value as Taste)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-lg border-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl bg-white"
                  required
                >
                  <option value="" disabled>{t("add_offer.select_taste_profile")}</option>
                  <option value="sweet">{t("add_offer.taste_sweet")}</option>
                  <option value="salty">{t("add_offer.taste_salty")}</option>
                  <option value="both">{t("add_offer.taste_both")}</option>
                  <option value="neutral">{t("add_offer.taste_neutral")}</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Navigation Buttons */}
        <div className="flex gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-gray-200">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              className="flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("add_offer.previous")}
            </Button>
          )}
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceedToNextStep()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 rounded-xl transition-all"
            >
              {t("add_offer.next")}
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={submitting || !canProceedToNextStep()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold flex items-center justify-center gap-2 text-sm sm:text-base py-2.5 sm:py-3 rounded-xl transition-all"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  {t("add_offer.creating_offer")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t("add_offer.create_button")}
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
      )}
    </>
  );
};

export default EnhancedAddOffer;
