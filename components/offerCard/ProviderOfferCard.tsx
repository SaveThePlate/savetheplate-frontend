"use client";

import { FC, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { ProviderOfferCardProps } from "./types";
import { PriceBadge } from "./shared/PriceBadge";
import { QuantityBadge } from "./shared/QuantityBadge";
import { ProviderOverlay } from "./shared/ProviderOverlay";
import { formatDateTime, isOfferExpired, DEFAULT_LOGO, getImageFallbacksForOffer } from "./utils";
import { shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { getImageFallbacks } from "@/utils/imageUtils";
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
  pickupLocation,
  mapsLink,
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
  const [localData, setLocalData] = useState({
    title,
    description,
    price,
    originalPrice: originalPrice || "",
    quantity,
    expirationDate: expirationDate || "",
    pickupLocation: pickupLocation || "",
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

  // Sync localData with props when they change
  useEffect(() => {
    setLocalData({
      title,
      description,
      price,
      originalPrice: originalPrice || "",
      quantity,
      expirationDate: expirationDate || "",
      pickupLocation: pickupLocation || "",
    });
  }, [title, description, price, originalPrice, quantity, expirationDate, pickupLocation, offerId]);

  // Sync image display
  useEffect(() => {
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
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token");

      const response = await axiosInstance.post("/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      const uploaded = Array.isArray(response.data) ? response.data : [response.data];

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

        return {
          filename: filename,
          url: url,
          absoluteUrl: absoluteUrl,
        };
      });
      return mapped;
    } catch (err: any) {
      console.error("Upload error", err?.response?.data || err.message || err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to upload images";
      toast.error(errorMessage);
      throw err;
    }
  };

  const handleImageUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      setLocalFiles(null);
      setUploadedImages([]);
      return;
    }
    
    setUploadingImages(true);
    try {
      const uploaded = await uploadFiles(files);
      setUploadedImages(uploaded);
      setLocalFiles(files);
      toast.success(t("offer_card.upload_success", { count: uploaded.length }));
    } catch (error: any) {
      setLocalFiles(null);
      setUploadedImages([]);
      toast.error(t("offer_card.upload_failed"));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleEdit = async () => {
    if (!localData.title || !localData.description) {
      toast.error(t("offer_card.fill_fields"));
      return;
    }

    // Validate required fields
    if (!localData.price || !localData.quantity || !localData.expirationDate || !localData.pickupLocation) {
      toast.error(t("offer_card.fill_fields"));
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return router.push("/signIn");
    }

    try {
      // Upload images if new files were selected
      let finalImages = uploadedImages;
      if (localFiles && localFiles.length > 0) {
        // Always upload when localFiles are present (user has selected new files)
        toast.info("Uploading images...");
        finalImages = await uploadFiles(localFiles);
        setUploadedImages(finalImages);
      }

      // Parse and validate price
      const priceValue = parseFloat(String(localData.price).trim());
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error(t("offer_card.invalid_price"));
        setLoading(false);
        return;
      }

      // Parse and validate quantity
      const quantityValue = parseInt(String(localData.quantity).trim(), 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        toast.error(t("offer_card.invalid_quantity"));
        setLoading(false);
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
        toast.error(t("offer_card.invalid_date"));
        setLoading(false);
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

      const payload: any = {
        title: String(localData.title).trim(),
        description: String(localData.description).trim(),
        price: priceValue,
        quantity: quantityValue,
        expirationDate: localData.expirationDate,
        pickupLocation: String(localData.pickupLocation).trim(),
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
      });
      
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
      console.error("Error updating offer:", err);
      const errorMessage = err?.response?.data?.message || err?.message || t("offer_card.update_failed");
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    setTimeout(() => {
      onDelete?.(offerId);
    }, 250);
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime(expirationDate);
  const expired = isOfferExpired(expirationDate);
  const isRescuePack = title.toLowerCase().includes("rescue pack");

  return (
    <Card className={`flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm transition-all ${isDeleting ? "opacity-0 scale-95" : ""}`}>
      {/* Image */}
      <div className="relative w-full h-40 sm:h-44">
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
        <ProviderOverlay owner={owner} pickupLocation={pickupLocation} />

        {expired && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-md z-10">
            {t("common.expired")}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3">
        <CardHeader className="p-0">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
            {title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {description}
          </CardDescription>

          <div className="flex flex-col gap-2 mt-2">
            {mapsLink ? (
              <a
                href={mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center gap-2 px-3 py-2 bg-teal-50 text-teal-700 font-medium rounded-2xl text-left"
              >
                <span className="text-lg">📍</span>
                <span className="truncate">{pickupLocation || "View on Map"}</span>
              </a>
            ) : (
              <p className="text-gray-600 font-medium w-full">{pickupLocation || "Provider"}</p>
            )}
            <p className="text-gray-600 text-sm mt-1">🕑 {formattedDate} {formattedTime}</p>
          </div>
        </CardHeader>

        {/* Footer Buttons */}
        <CardFooter className="mt-4 flex w-full gap-3">
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
                    pickupLocation: pickupLocation || "",
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
                  className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-medium hover:bg-gray-50"
                >
                  {t("common.edit")}
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 max-w-lg mx-auto border border-gray-100">
                <CredenzaHeader className="mb-4">
                  <CredenzaTitle className="text-xl font-bold text-gray-900">
                    {t("offer_card.edit_offer")}
                  </CredenzaTitle>
                  <CredenzaDescription className="text-sm text-gray-500 mt-1">
                    {t("offer_card.update_details")}
                  </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-title" className="text-sm font-semibold text-gray-700">
                      {t("offer_card.title_label")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-title"
                      name="title"
                      value={localData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      placeholder={t("offer_card.title_label")}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">
                      {t("offer_card.description_label")} <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={localData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
                      disabled={loading}
                      placeholder={t("offer_card.description_label")}
                    />
                  </div>

                  {/* Price Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="edit-price" className="text-sm font-semibold text-gray-700">
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
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          disabled={loading}
                          placeholder="0.00"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">dt</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="edit-originalPrice" className="text-sm font-semibold text-gray-700">
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
                          className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                          disabled={loading}
                          placeholder="0.00"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">dt</span>
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
                    <label htmlFor="edit-quantity" className="text-sm font-semibold text-gray-700">
                      {t("offer_card.quantity_label")} <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-quantity"
                      type="number"
                      min="0"
                      name="quantity"
                      value={localData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Images Upload */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">
                      {t("offer_card.images_label")} {uploadedImages.length > 0 && <span className="text-emerald-600">({t("offer_card.images_uploaded", { count: uploadedImages.length })})</span>}
                    </label>
                    <FileUploader
                      value={localFiles || []}
                      onValueChange={handleImageUpload}
                      dropzoneOptions={{
                        accept: { "image/*": [".jpg", ".jpeg", ".png"] },
                        multiple: true,
                        maxFiles: 5,
                        maxSize: 5 * 1024 * 1024,
                      }}
                    >
                      <FileInput>
                        <div className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                          {uploadingImages ? (
                            <>
                              <div className="animate-spin text-2xl mb-2">⏳</div>
                              <p className="text-gray-600 text-sm">{t("offer_card.uploading")}</p>
                            </>
                          ) : localFiles && localFiles.length > 0 ? (
                            <>
                              <div className="text-2xl mb-2">✓</div>
                              <p className="text-gray-600 text-sm">{t("offer_card.images_ready", { count: localFiles.length })}</p>
                            </>
                          ) : (
                            <>
                              <div className="text-2xl mb-2">📸</div>
                              <p className="text-gray-600 text-sm">{t("offer_card.click_upload")}</p>
                              <p className="text-xs text-gray-500 mt-1">{t("offer_card.up_to_5")}</p>
                            </>
                          )}
                        </div>
                      </FileInput>
                      <FileUploaderContent>
                        {localFiles && localFiles.map((file, index) => (
                          <FileUploaderItem
                            key={index}
                            index={index}
                            className="size-24 p-0 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm"
                          >
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover rounded-xl"
                              unoptimized={true}
                            />
                          </FileUploaderItem>
                        ))}
                      </FileUploaderContent>
                    </FileUploader>
                    <p className="text-xs text-gray-500">
                      {t("offer_card.images_hint")}
                    </p>
                  </div>
                </CredenzaBody>

                <CredenzaFooter className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 sticky bottom-0 bg-white z-10">
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
                        pickupLocation: pickupLocation || "",
                      });
                      setLocalFiles(null);
                      setUploadedImages([]);
                      setUploadingImages(false);
                    }}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                    disabled={loading}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={loading || uploadingImages}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                <button className="w-full bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600">
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

