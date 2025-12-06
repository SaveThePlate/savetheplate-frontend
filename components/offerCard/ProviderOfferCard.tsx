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
    });
  }, [title, description, price, originalPrice, quantity, offerId]);

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
      toast.success(`${uploaded.length} image(s) uploaded successfully!`);
    } catch (error: any) {
      setLocalFiles(null);
      setUploadedImages([]);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleEdit = async () => {
    if (!localData.title || !localData.description) {
      toast.error("Please fill out all fields");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    try {
      let finalImages = uploadedImages;
      if (localFiles && localFiles.length > 0 && uploadedImages.length === 0) {
        toast.info("Uploading images...");
        finalImages = await uploadFiles(localFiles);
        setUploadedImages(finalImages);
      }

      const originalPriceValue = localData.originalPrice 
        ? parseFloat(localData.originalPrice as any) 
        : undefined;

      const imagesPayload = finalImages.length > 0 
        ? finalImages.map((img) => ({
            filename: img.filename,
            url: img.url,
            absoluteUrl: img.absoluteUrl,
            original: img.url.startsWith("/") && !img.url.startsWith("/storage/") 
              ? { url: img.url }
              : undefined,
          }))
        : undefined;

      const payload: any = {
        ...localData,
        price: parseFloat(localData.price as any),
        originalPrice: originalPriceValue && !isNaN(originalPriceValue) && originalPriceValue > parseFloat(localData.price as any)
          ? originalPriceValue 
          : undefined,
        quantity: parseInt(localData.quantity as any, 10),
      };

      if (imagesPayload && imagesPayload.length > 0) {
        payload.images = JSON.stringify(imagesPayload);
      }

      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${offerId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Offer updated successfully");
      setLocalData({
        ...payload,
        originalPrice: payload.originalPrice || "",
      });
      setLocalFiles(null);
      setUploadedImages([]);
      setIsEditing(false);
      onUpdate?.(offerId, payload);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update offer");
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
            src={currentImage || DEFAULT_LOGO}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onError={handleImageError}
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,..."
            className="object-cover"
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
            Expired
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
                  Edit
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 max-w-lg mx-auto border border-gray-100">
                <CredenzaHeader className="mb-4">
                  <CredenzaTitle className="text-xl font-bold text-gray-900">
                    Edit Offer
                  </CredenzaTitle>
                  <CredenzaDescription className="text-sm text-gray-500 mt-1">
                    Update your offer details below
                  </CredenzaDescription>
                </CredenzaHeader>

                <CredenzaBody className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-title" className="text-sm font-semibold text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="edit-title"
                      name="title"
                      value={localData.title}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      disabled={loading}
                      placeholder="Enter offer title"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-description" className="text-sm font-semibold text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="edit-description"
                      name="description"
                      value={localData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
                      disabled={loading}
                      placeholder="Describe your offer..."
                    />
                  </div>

                  {/* Price Fields */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="edit-price" className="text-sm font-semibold text-gray-700">
                        Price <span className="text-red-500">*</span>
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
                        Original Price
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
                      Quantity <span className="text-red-500">*</span>
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
                      Images {uploadedImages.length > 0 && <span className="text-emerald-600">({uploadedImages.length} uploaded)</span>}
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
                              <p className="text-gray-600 text-sm">Uploading...</p>
                            </>
                          ) : localFiles && localFiles.length > 0 ? (
                            <>
                              <div className="text-2xl mb-2">✓</div>
                              <p className="text-gray-600 text-sm">{localFiles.length} image(s) ready</p>
                            </>
                          ) : (
                            <>
                              <div className="text-2xl mb-2">📸</div>
                              <p className="text-gray-600 text-sm">Click to upload or drag and drop</p>
                              <p className="text-xs text-gray-500 mt-1">Up to 5 images (optional)</p>
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
                              className="size-24 object-cover rounded-xl"
                            />
                          </FileUploaderItem>
                        ))}
                      </FileUploaderContent>
                    </FileUploader>
                    <p className="text-xs text-gray-500">
                      {uploadedImages.length > 0 
                        ? "New images will replace existing ones. Leave empty to keep current images."
                        : "Upload new images to replace existing ones, or leave empty to keep current images."}
                    </p>
                  </div>
                </CredenzaBody>

                <CredenzaFooter className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                  <CredenzaClose asChild>
                    <button 
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </CredenzaClose>
                  <button
                    onClick={handleEdit}
                    disabled={loading || uploadingImages}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : uploadingImages ? "Uploading..." : "Save Changes"}
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
                  Delete
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-3xl shadow-xl p-6 max-w-sm mx-auto border border-gray-100">
                <CredenzaHeader>
                  <CredenzaTitle className="text-lg font-semibold text-gray-900">
                    Confirm Deletion
                  </CredenzaTitle>
                </CredenzaHeader>

                <CredenzaDescription className="text-sm text-gray-600 mt-2">
                  Are you sure you want to delete this offer? This action cannot be undone.
                </CredenzaDescription>

                <CredenzaFooter className="flex justify-end gap-3 mt-4">
                  <CredenzaClose asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200">
                      Cancel
                    </button>
                  </CredenzaClose>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600"
                  >
                    Delete
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

