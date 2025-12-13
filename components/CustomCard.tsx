"use client";

import { FC, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { getImageFallbacks, resolveImageSource, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { formatDateTimeRange } from "./offerCard/utils";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
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
import { VisuallyHidden } from "@/components/ui/visually-hidden";

// Small utility to generate a tiny SVG blur placeholder data URL.
const getBlurDataURL = (color = "#eaeaea") => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='${color}'/></svg>`;
  if (typeof window === "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};


interface CustomCardProps {
  offerId: number;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  ownerId: number;
  quantity: number;
  expirationDate?: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupLocation: string;
  mapsLink?: string;
  reserveLink?: string;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, data: any) => void;
  owner?: {
    id: number;
    username: string;
    profileImage?: string;
  };
}

const CustomCard: FC<CustomCardProps> = ({
  imageSrc,
  imageAlt = "Offer image",
  offerId,
  title,
  description,
  price,
  originalPrice,
  ownerId,
  quantity,
  expirationDate,
  pickupStartTime,
  pickupEndTime,
  pickupLocation,
  mapsLink = "#",
  reserveLink = "#",
  onDelete,
  onUpdate,
  owner,
}) => {
  const { t } = useLanguage();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleDelete = async () => {
    setShowDeleteConfirm(false); // close modal first
    setIsDeleting(true); // trigger fade-out animation
    setTimeout(() => {
      onDelete?.(offerId);
    }, 250);
  };

  const { date: formattedDate, time: formattedTime } = formatDateTimeRange(
    pickupStartTime,
    pickupEndTime,
    expirationDate
  );
  const isExpired =
    expirationDate && new Date(expirationDate).getTime() <= new Date().getTime();

  const isClient = role === "CLIENT";

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRole(response?.data?.role);
      } catch {
        router.push("/onboarding");
      }
    };
    fetchUserRole();
  }, [router]);

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

  // Upload images function
  const uploadFiles = async (files: File[]): Promise<Array<{
    filename: string;
    url: string;
    absoluteUrl: string;
  }>> => {
    if (!files || files.length === 0) return [];

    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));

    try {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000, // 30 second timeout
      });

      const data = res.data as any[];
      console.log("Upload response data:", data); // Debug log
      
      const mapped = data.map((item) => {
        const filename = item.filename || item.path || "";
        const url = item.url || `/storage/${filename}`;
        
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
        };
      });
      return mapped;
    } catch (err: any) {
      console.error("Upload error", err?.response?.data || err.message || err);
      const errorMessage = sanitizeErrorMessage(err, {
        action: "upload images",
        defaultMessage: "Unable to upload images. Please check the files and try again."
      });
      toast.error(errorMessage);
      throw err;
    }
  };

  // Handle image upload
  const handleImageUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      setLocalFiles(null);
      setUploadedImages([]);
      return;
    }
    
    // Set local files immediately to show preview right away
    setLocalFiles(files);
    setUploadingImages(true);
    
    // Upload images in the background
    try {
      const uploaded = await uploadFiles(files);
      setUploadedImages(uploaded);
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
      toast.error(t("custom_card.fill_all_fields"));
      return;
    }

    // Validate required fields
    if (!localData.price || !localData.quantity || !localData.expirationDate || !localData.pickupLocation) {
      toast.error(t("custom_card.fill_all_fields"));
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
        toast.info(t("custom_card.uploading_images"));
        finalImages = await uploadFiles(localFiles);
        setUploadedImages(finalImages);
      }

      // Parse and validate price
      const priceValue = parseFloat(String(localData.price).trim());
      if (isNaN(priceValue) || priceValue <= 0) {
        toast.error(t("custom_card.invalid_price") || "Invalid price");
        setLoading(false);
        return;
      }

      // Parse and validate quantity
      const quantityValue = parseInt(String(localData.quantity).trim(), 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        toast.error(t("custom_card.invalid_quantity") || "Invalid quantity");
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
        toast.error(t("custom_card.invalid_date") || "Invalid expiration date");
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
      toast.success(t("custom_card.offer_updated"));
      setLocalData({
        ...localData,
        originalPrice: originalPriceValue !== undefined ? String(originalPriceValue) : "",
      });
      // Clear image upload state
      setLocalFiles(null);
      setUploadedImages([]);
      setIsEditing(false);
      // Pass the response data (updated offer) to onUpdate if available, otherwise use payload
      onUpdate?.(offerId, response.data || payload);
    } catch (err: any) {
      console.error("Error updating offer:", err);
      const errorMessage = sanitizeErrorMessage(err, {
        action: "update offer",
        defaultMessage: t("custom_card.update_failed") || "Unable to update offer. Please try again."
      });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const DEFAULT_LOGO = "/defaultBag.png";
  const [currentImage, setCurrentImage] = useState<string | undefined>(imageSrc);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([]);

  useEffect(() => {
    if (imageSrc) {
      // Generate all possible fallback URLs
      const imageFallbacks = getImageFallbacks(imageSrc);
      setFallbacks(imageFallbacks);
      setCurrentImage(imageFallbacks[0] || DEFAULT_LOGO);
      setFallbackIndex(0);
    } else {
      setCurrentImage(DEFAULT_LOGO);
      setFallbacks([DEFAULT_LOGO]);
      setFallbackIndex(0);
    }
  }, [imageSrc]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Try next fallback in the list
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < fallbacks.length) {
      setFallbackIndex(nextIndex);
      setCurrentImage(fallbacks[nextIndex]);
    } else {
      // All fallbacks exhausted, use default
      setCurrentImage(DEFAULT_LOGO);
    }
  };

  // Check if this is a Rescue Pack
  const isRescuePack = localData.title.toLowerCase().includes("rescue pack");

  if (isClient) {
    // Client card: simple, clean design matching reference
    return (
      <Card className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow cursor-pointer">
        {/* Image */}
        <div className="relative w-full h-48 sm:h-52">
          {currentImage ? (
            <Image
              src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
              alt={localData.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              onError={handleImageError}
              priority
              placeholder="blur"
              blurDataURL={getBlurDataURL()}
              className="object-cover"
              unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}

          {/* Price Badge - top right */}
          <div className="absolute top-2 right-2 bg-emerald-600 text-white font-semibold px-2.5 py-1.5 rounded-full text-xs shadow-md z-10">
            <div className="flex flex-col items-end leading-tight">
              <span className="font-bold text-sm">{localData.price} dt</span>
              {originalPrice && originalPrice > localData.price && (
                <>
                  <span className="text-[10px] font-normal line-through opacity-75">
                    {originalPrice.toFixed(2)} dt
                  </span>
                  <span className="text-[10px] font-bold mt-0.5 bg-white/20 px-1 py-0.5 rounded">
                    -{((1 - localData.price / originalPrice) * 100).toFixed(0)}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quantity Badge - top left */}
          {localData.quantity > 0 && !isExpired && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md z-10">
              {localData.quantity} left
            </div>
          )}

          {/* Provider Profile Image and Name Overlay - bottom left */}
          {owner && (
            <div className="absolute bottom-2 left-2 flex items-center gap-2 z-10 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-lg border border-white/50">
              <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0">
                <Image
                  src={sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
                  alt={owner.username}
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                  unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png"))}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/logo.png";
                  }}
                />
              </div>
              <p className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">{owner.username}</p>
            </div>
          )}

          {/* Expired Badge */}
          {isExpired && (
            <div className="absolute top-2 left-2 bg-gray-800 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md z-10">
              Expired
            </div>
          )}
        </div>

        {/* Content - Simple and Clean */}
        <div className="flex flex-col flex-1 p-4">
          {/* Offer Type Label */}
          <p className="text-sm font-medium text-gray-700 mb-1">
            {isRescuePack ? "Rescue Pack" : "Custom Offer"}
          </p>

          {/* Pickup Time */}
          <p className="text-xs text-gray-600 mb-3">
            Pick up {formattedDate === "Today" ? "today" : formattedDate}{formattedTime && (formattedTime.includes(" - ") ? ` between ${formattedTime}` : ` at ${formattedTime}`)}
          </p>
        </div>

        {/* Details Modal - Redesigned */}
        <Credenza open={isModalOpen} onOpenChange={setIsModalOpen}>
          <CredenzaTrigger asChild>
            <div className="absolute inset-0" />
          </CredenzaTrigger>

          <CredenzaContent className="bg-white rounded-3xl shadow-xl max-w-lg border border-gray-100 p-0 overflow-hidden">
            {/* Accessibility: DialogTitle and Description for screen readers */}
            <VisuallyHidden>
              <CredenzaTitle>{localData.title}</CredenzaTitle>
              <CredenzaDescription>{localData.description}</CredenzaDescription>
            </VisuallyHidden>
            
            {/* Large Image at Top */}
            <div className="relative w-full h-64">
              {currentImage ? (
            <Image
              src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
              alt={localData.title}
              fill
              sizes="(max-width: 640px) calc(100vw - 2rem), 512px"
              className="object-cover"
              unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
              onError={handleImageError}
            />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>

            <div className="p-6">
              {/* Store Information */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {owner && (
                    <div className="w-12 h-12 rounded-full border-2 border-gray-200 overflow-hidden bg-white flex-shrink-0">
                      <Image
                        src={owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png"}
                        alt={owner.username}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/logo.png";
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {owner?.username || "Provider"}
                    </h3>
                    <p className="text-sm text-gray-600">{pickupLocation}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">{localData.price} dt</p>
                  {originalPrice && originalPrice > localData.price && (
                    <p className="text-sm text-gray-500 line-through">{originalPrice.toFixed(2)} dt</p>
                  )}
                </div>
              </div>

              {/* Offer Details */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {isRescuePack ? "Rescue Pack" : "Custom Offer"}
                  {owner && ` rescued by ${owner.username}`}
                </p>
                <p className="text-base text-gray-800 leading-relaxed">{localData.description}</p>
              </div>

              {/* Pickup Information */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-900 mb-1">Pickup Details</p>
                <p className="text-sm text-gray-600">
                  {formattedDate}{formattedTime && (formattedTime.includes(" - ") ? ` between ${formattedTime}` : ` at ${formattedTime}`)}
                </p>
                {mapsLink && (
                  <a
                    href={mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-emerald-600 font-medium mt-1 inline-flex items-center gap-1"
                  >
                    View on Maps →
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {!isExpired && localData.quantity > 0 && (
                  <Link
                    href={reserveLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Order Now
                  </Link>
                )}
                {isExpired && (
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 font-semibold rounded-xl">
                    Expired
                  </div>
                )}
              </div>
            </div>
          </CredenzaContent>
        </Credenza>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
      {/* 🖼️ Image */}
      <div className="relative w-full h-40 sm:h-44">
        {currentImage ? (
          <Image
            src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
            alt={localData.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onError={handleImageError}
            priority
            placeholder="blur"
            blurDataURL={getBlurDataURL()}
            className="object-cover"
            unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}

        {/* 💰 Price Badge */}
        <div className="absolute top-2 right-2 bg-emerald-600 text-white font-semibold px-2 py-1 rounded-full text-xs shadow-md">
          <div className="flex flex-col items-end leading-tight">
            <span className="font-bold text-sm">{localData.price} dt</span>
            {originalPrice && originalPrice > localData.price && (
              <>
                <span className="text-[10px] font-normal line-through opacity-75">
                  {originalPrice.toFixed(2)} dt
                </span>
                <span className="text-[10px] font-bold mt-0.5 bg-white/20 px-1 py-0.5 rounded">
                  -{((1 - localData.price / originalPrice) * 100).toFixed(0)}%
                </span>
              </>
            )}
          </div>
        </div>

        {/* 📦 Quantity Badge - moved to bottom-right to avoid conflict with provider overlay */}
        <div
          className={`absolute bottom-2 right-2 px-2 py-0.5 text-xs font-medium rounded-full shadow-md ${
            localData.quantity > 0
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-600"
          }`}
        >
          {localData.quantity > 0 ? `${localData.quantity} left` : "Sold Out"}
        </div>

        {/* Provider Profile Image and Name Overlay */}
        {owner && (
          <div className="absolute bottom-2 left-2 flex items-center gap-2 z-10 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-lg border border-white/50">
            <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0">
              <Image
                src={owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png"}
                alt={owner.username}
                width={32}
                height={32}
                className="object-cover w-full h-full"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/logo.png";
                }}
              />
            </div>
            <p className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">{owner.username}</p>
          </div>
        )}

        {/* Expired Badge */}
        {isExpired && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white px-2 py-0.5 rounded-full text-xs font-medium shadow-md z-10">
            Expired
          </div>
        )}
      </div>

      {/* 📋 Content */}
      <div className="flex flex-col flex-1 p-3">
        <CardHeader className="p-0">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
            {localData.title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {localData.description}
          </CardDescription>

          {/* 📍 Location + Provider button (date stacked below location) */}
          <div className="flex flex-col gap-2">
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

            <p className="text-gray-600 text-sm mt-1">🕑 {formattedDate}{formattedTime && (formattedTime.includes(" - ") ? ` between ${formattedTime}` : ` at ${formattedTime}`)}</p>
          </div>
        </CardHeader>

        {/* 🧭 Footer Buttons */}
        {role === "CLIENT" && (
          <CardFooter className=" mt-4 flex flex-row gap-3 w-full items-center justify-between">
            {isExpired ? (
              <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium">
                Expired
              </div>
            ) : localData.quantity > 0 ? (
              <Link
                href={reserveLink}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-teal-600 text-white font-semibold rounded-lg shadow-sm"
              >
                Order
              </Link>
            ) : (
              <div className="flex-1"></div>
            )}

            {/* Details Modal */}
            <Credenza>
              <CredenzaTrigger asChild>
                <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm">
                  Details
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto border border-gray-100">
                <CredenzaHeader className="mb-3">
                  <CredenzaTitle className="text-xl font-bold text-gray-900">
                    {localData.title}
                  </CredenzaTitle>
                </CredenzaHeader>

                <CredenzaDescription className="text-sm text-gray-600 mb-3">
                  Details about this offer: {localData.title}
                </CredenzaDescription>

                <CredenzaBody className="space-y-3 text-gray-700 text-sm">
                  <p>{localData.description}</p>
                  <p>
                    <strong>Pickup Time:</strong> {formattedDate}{formattedTime && (formattedTime.includes(" - ") ? ` between ${formattedTime}` : ` at ${formattedTime}`)}
                  </p>
                  <p>
                    <strong>Location:</strong> {pickupLocation}
                  </p>
                  {isExpired && (
                    <p className="text-red-600 font-semibold">
                      <strong>Expired</strong>
                    </p>
                  )}
                </CredenzaBody>

                <CredenzaFooter className="flex justify-end gap-3 mt-5">
                  <CredenzaClose asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl">
                      Close
                    </button>
                  </CredenzaClose>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </CardFooter>
        )}

        {/* 🧭 Provider Footer */}
        {role === "PROVIDER" && (
          <CardFooter className="mt-4 flex w-full gap-3">
            {/* ✏️ Edit Modal */}
            <div className="flex-1">
              <Credenza 
                open={isEditing} 
                onOpenChange={(open) => {
                  setIsEditing(open);
                  // Reset form data and image upload state when modal closes
                  if (!open) {
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
                    className="w-full bg-white border border-gray-300 text-gray-800 px-3 py-2 rounded-lg font-medium"
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
                          multiple: false,
                          maxFiles: 1,
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
                                <p className="text-xs text-gray-500 mt-1">1 image, max 5MB (optional)</p>
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
                                className={`size-24 p-0 rounded-xl overflow-hidden border-2 shadow-sm relative ${
                                  isUploaded ? "border-emerald-600" : "border-yellow-400"
                                }`}
                              >
                                <div className="w-full h-full flex items-center justify-center">
                                  <img
                                    src={sanitizeImageUrl(imageSrc) || "/defaultBag.png"}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover rounded-xl"
                                    onError={(e) => {
                                      // Only fallback to default if it's not already the default
                                      const target = e.target as HTMLImageElement;
                                      const currentSrc = target.src;
                                      
                                      console.error("Image failed to load:", currentSrc); // Debug log
                                      
                                      // Only fallback if we're not already showing the default
                                      if (!currentSrc.includes("defaultBag.png")) {
                                        target.src = "/defaultBag.png";
                                      }
                                    }}
                                    onLoad={() => {
                                      console.log("Image loaded successfully:", imageSrc); // Debug log
                                    }}
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
                        {uploadedImages.length > 0 
                          ? "New images will replace existing ones. Leave empty to keep current images."
                          : "Upload new images to replace existing ones, or leave empty to keep current images."}
                      </p>
                    </div>
                  </CredenzaBody>

                  <CredenzaFooter className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
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
                      Cancel
                    </button>
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
                  <button className="w-full bg-red-500 text-white px-3 py-2 rounded-lg font-medium">
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

                  <CredenzaBody className="text-gray-700 text-sm mt-2">
                    This action cannot be undone.
                  </CredenzaBody>

                  <CredenzaFooter className="flex justify-end gap-3 mt-4">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200"
                    >
                      Cancel
                    </button>
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
        )}
      </div>
    </Card>
  );

};


export default CustomCard;