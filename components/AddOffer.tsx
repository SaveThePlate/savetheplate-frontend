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
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DropzoneOptions } from "react-dropzone";
import React, { useState, useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";

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

  const axiosInstance = axios.create({
    baseURL: (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, ""),
    headers: { "Content-Type": "application/json" },
  });

  axiosInstance.interceptors.request.use((config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  useEffect(() => {
    // Keep uploaded images even if localFiles is cleared (they're already uploaded)
    // Only clear if localFiles is explicitly set to null
    if (localFiles === null && uploadedImages.length > 0) {
      setUploadedImages([]);
    }
  }, [localFiles, uploadedImages.length]);

  // ✅ Upload files
  async function uploadFiles(files: File[]): Promise<UploadedImage[]> {
    if (!files || files.length === 0) return [];

    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data as any[];
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
      toast.success(t("add_offer.images_uploaded_success", { count: uploaded.length }));
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
    // Upload images immediately when selected
    await handleImage(newFiles);
  };

  // ✅ Dropzone config
  const dropzone: DropzoneOptions = {
    accept: { "image/*": [".jpg", ".jpeg", ".png"] },
    multiple: true,
    maxFiles: 5,
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
        toast.info(t("add_offer.info_uploading"));
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

      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
            required
            maxLength={100}
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
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("add_offer.description_hint", { count: description.length })}
          </p>
        </div>

        {/* Price and Quantity Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <p className="text-xs text-gray-500 mt-1">{t("add_offer.original_price_hint")}</p>
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
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">dt</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {originalPrice && parseFloat(originalPrice) > parseFloat(price || "0") && (
                <span className="text-emerald-600 font-semibold">
                  {t("add_offer.save_percentage", { percentage: ((1 - parseFloat(price || "0") / parseFloat(originalPrice)) * 100).toFixed(0) })}
                </span>
              )}
              {(!originalPrice || parseFloat(originalPrice) <= parseFloat(price || "0")) && t("add_offer.price_hint")}
            </p>
          </div>
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
            className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
            required
          />
          <p className="text-xs text-gray-500 mt-1">{t("add_offer.quantity_hint")}</p>
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
              className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
              required
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
              {/* Show uploaded images from backend if available */}
              {uploadedImages.length > 0 && uploadedImages.map((img, i) => (
                <div
                  key={`uploaded-${i}`}
                  className="relative size-24 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm"
                >
                  <Image
                    src={img.absoluteUrl || img.url || DEFAULT_BAG_IMAGE}
                    alt={img.filename}
                    height={96}
                    width={96}
                    className="size-24 object-cover rounded-xl"
                    unoptimized
                  />
                  <div className="absolute top-1 right-1 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    ✓
                  </div>
                </div>
              ))}
              {/* Show local files that haven't been uploaded yet */}
              {localFiles?.map((file, i) => {
                // Check if this file corresponds to an uploaded image
                const uploadedIndex = uploadedImages.findIndex(img => {
                  // Try to match by filename or by index
                  return img.filename === file.name || 
                         (uploadedImages.length > i && uploadedImages[i]?.filename);
                });
                
                // If uploaded, don't show as pending
                if (uploadedIndex >= 0) return null;
                
                return (
                  <FileUploaderItem
                    key={i}
                    index={i}
                    className="size-24 p-0 rounded-xl overflow-hidden border-2 border-yellow-200 shadow-sm relative"
                    aria-roledescription={`File ${i + 1} containing ${file.name}`}
                  >
                    <Image
                      src={URL.createObjectURL(file) || DEFAULT_BAG_IMAGE}
                      alt={file.name}
                      height={96}
                      width={96}
                      className="w-full h-full object-cover rounded-xl"
                      unoptimized={true}
                    />
                    <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      ⏳
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

        {/* Submit */}
        <Button
          type="submit"
          disabled={!title.trim() || !price || !quantity || !pickupDate || !pickupStartTime || !pickupEndTime}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.01] mt-2"
        >
          {t("add_offer.create_button")}
        </Button>
      </form>
    </div>
  );
};

export default AddOffer;