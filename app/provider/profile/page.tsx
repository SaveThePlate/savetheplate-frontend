"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import { useRouter } from "next/navigation";
import { resolveImageSource, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { compressImage, shouldCompress } from "@/utils/imageCompression";
import { ShoppingBag, ChevronRight, LogOut, Heart, MessageCircle, Settings } from "lucide-react";

interface ProfileData {
  username: string;
  location: string;
  phoneNumber: string;
  mapsLink?: string;
  profileImage?: string | { url?: string };
}

interface Order {
  id: number;
  quantity: number;
  status: string;
  offer?: {
    price?: number;
  };
}

interface Offer {
  id: number;
  quantity: number;
}

const DEFAULT_PROFILE_IMAGE = "/logo.png";

// Custom hook for fetching profile and stats
const useProviderProfile = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({
    totalOffers: 0,
    totalItems: 0,
    revenue: 0,
    totalMealsSaved: 0,
    co2Saved: 0,
    waterSaved: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      let userId: string | number | undefined;
      try {
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        userId = tokenPayload?.id;
      } catch (error) {
        console.error("Error parsing token:", error);
        // Try to get userId from API if token parsing fails
        try {
          const userResponse = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers });
          userId = userResponse.data?.id;
        } catch (apiError) {
          console.error("Error fetching user info:", apiError);
          setError("Could not fetch user information");
          setLoading(false);
          return;
        }
      }

      if (!userId) {
        setError("Could not determine user ID");
        setLoading(false);
        return;
      }

      // Fetch profile, offers, and orders in parallel for faster loading
      const [profileRes, offersRes, ordersRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${userId}`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/provider`, { headers }),
      ]);

      // Process profile data first (show immediately)
      const { username, location, phoneNumber, profileImage, mapsLink } =
        profileRes.data || {};
      
      // Extract location if needed (non-blocking, can happen after profile is shown)
      let finalLocation = location;
      if (!finalLocation && mapsLink) {
        // Don't await this - set profile first, then update location if needed
        axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/extract-location`,
          { mapsLink },
          { 
            headers,
            timeout: 10000, // 10 second timeout for hosted apps
          }
        ).then((locationRes) => {
          const extractedLocation = locationRes.data.locationName || location;
          setProfile((prev) => prev ? { ...prev, location: extractedLocation || "Location" } : null);
        }).catch((err: any) => {
          console.error("Failed to extract location:", err);
          // Silently fail for profile page - location extraction is non-critical here
          // User can manually edit location if needed
        });
      }
      
      // Set profile immediately
      setProfile({
        username: username || "Username",
        location: finalLocation || "Location",
        phoneNumber: phoneNumber ? String(phoneNumber) : "Phone number",
        mapsLink: mapsLink || "",
        profileImage: profileImage ?? undefined,
      });

      // Process stats
      const offers = offersRes.data || [];
      const totalOffers = offers.length;
      const totalItems = offers.reduce(
        (sum: number, o: any) => sum + (o.quantity ?? 0),
        0
      );

      const orders: Order[] = ordersRes.data || [];
      const confirmedOrders = orders.filter((o) => o.status === "confirmed");
      
      // Calculate revenue: sum of (quantity * price) for all confirmed orders
      const revenue = confirmedOrders.reduce((sum, order) => {
        const price = order.offer?.price || 0;
        return sum + order.quantity * price;
      }, 0);

      // Calculate environmental impact from confirmed orders
      // Each order quantity represents meals/bags saved
      const totalMealsSaved = confirmedOrders.reduce((sum, order) => sum + order.quantity, 0);
      
      // Environmental impact calculations
      // 1 meal saved ≈ 1.5 kg CO2 equivalent (conservative estimate)
      // 1 meal ≈ 1,500 liters of water saved
      const co2Saved = totalMealsSaved * 1.5; // kg CO2
      const waterSaved = totalMealsSaved * 1500; // liters

      setStats({
        totalOffers,
        totalItems,
        revenue,
        totalMealsSaved,
        co2Saved,
        waterSaved,
      });
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      const errorMsg = sanitizeErrorMessage(err, {
        action: "load profile",
        defaultMessage: t("provider.profile.fetch_failed") || "Unable to load profile. Please try again later."
      });
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { profile, stats, loading, error, refetch: fetchData };
};

// Edit Profile Dialog Component
const EditProfileDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfileData | null;
  onSave: (data: {
    username: string;
    phoneNumber: string;
    mapsLink: string;
    location?: string;
    profileImage?: string;
  }) => Promise<void>;
}> = ({ open, onOpenChange, profile, onSave }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    mapsLink: "",
  });
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);

  // Track if dialog was just opened to reset state only once
  const [dialogJustOpened, setDialogJustOpened] = useState(false);

  useEffect(() => {
    if (open && !dialogJustOpened) {
      // Dialog just opened - reset all state
      setDialogJustOpened(true);
      if (profile) {
        setFormData({
          username: profile.username || "",
          phoneNumber: profile.phoneNumber || "",
          mapsLink: profile.mapsLink || "",
        });
        setLocation(profile.location || "");
        setProfileImage(null);
        setLocalFile(null);
      }
    } else if (!open) {
      // Dialog closed - reset flag for next time
      setDialogJustOpened(false);
    }
  }, [open, profile, dialogJustOpened]);

  // Clean and extract Google Maps URL from pasted text
  const cleanGoogleMapsUrl = (text: string): string => {
    if (!text.trim()) return "";
    
    // Remove any leading/trailing whitespace
    text = text.trim();
    
    // Try to find a Google Maps URL in the text
    // Pattern 1: Full URLs (maps.google.com, google.com/maps, goo.gl/maps, maps.app.goo.gl)
    const urlPattern = /(https?:\/\/)?(www\.)?(maps\.)?(google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.google\.com)[^\s]*/gi;
    const urlMatch = text.match(urlPattern);
    if (urlMatch && urlMatch[0]) {
      let url = urlMatch[0];
      // Ensure it starts with http:// or https://
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      // Remove any trailing characters that aren't part of the URL
      url = url.replace(/[.,;!?]+$/, "");
      return url;
    }
    
    // Pattern 2: Short links (goo.gl, maps.app.goo.gl)
    const shortLinkPattern = /(https?:\/\/)?(goo\.gl|maps\.app\.goo\.gl)\/[a-zA-Z0-9]+/gi;
    const shortMatch = text.match(shortLinkPattern);
    if (shortMatch && shortMatch[0]) {
      let url = shortMatch[0];
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      return url;
    }
    
    // If no URL pattern found, return the text as-is (might be a valid URL format we don't recognize)
    return text;
  };

  // Extract location from Google Maps link
  const fetchLocationName = async (url: string) => {
    if (!url.trim()) {
      // Don't clear location if user has manually edited it
      return;
    }

    // Clean the URL first
    const cleanedUrl = cleanGoogleMapsUrl(url);
    if (!cleanedUrl) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || "";
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/extract-location`,
        { mapsLink: cleanedUrl },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000, // 10 second timeout for hosted apps
        }
      );

      const { locationName } = response.data;
      // Only update if we got a location name and user hasn't manually edited
      if (locationName) {
        setLocation(locationName);
      }
    } catch (error: any) {
      console.error("Error extracting location name:", error);
      
      // Check for network/CORS errors that are common on hosted apps
      const isNetworkError = 
        error?.code === 'ECONNABORTED' || // Timeout
        error?.code === 'ERR_NETWORK' || // Network error
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError') ||
        error?.message?.includes('CORS') ||
        error?.response?.status === 502 ||
        error?.response?.status === 503 ||
        error?.response?.status === 504;
      
      // Only show error for network/server errors, not for 400/401/403 which might be expected
      if (isNetworkError || (error?.response?.status >= 500)) {
        // Silently log - user can manually edit location if needed
        console.warn(
          "Location extraction failed:",
          isNetworkError 
            ? "Network error - please check your connection"
            : "Server error - please try again later"
        );
      }
      // Don't clear location on error - preserve user's manual edits
    }
  };

  const handleMapsLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Clean the URL and set it
    const cleanedUrl = cleanGoogleMapsUrl(inputValue);
    setFormData((prev) => ({ ...prev, mapsLink: cleanedUrl || inputValue }));
    fetchLocationName(cleanedUrl || inputValue);
  };

  // Handle paste events to clean the URL
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const cleanedUrl = cleanGoogleMapsUrl(pastedText);
    if (cleanedUrl && cleanedUrl !== pastedText) {
      e.preventDefault();
      setFormData((prev) => ({ ...prev, mapsLink: cleanedUrl }));
      fetchLocationName(cleanedUrl);
    }
  };

  // Handle profile image upload - using same method as AddOffer
  const handleImageUpload = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      setLocalFile(null);
      setProfileImage(null);
      return;
    }

    const file = files[0];
    // Set local file immediately to show preview right away
    setLocalFile(file);
    setUploadingImage(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        return;
      }

      // Compress image client-side before upload for faster transfer
      let fileToUpload = file;
      if (shouldCompress(file, 1)) {
        try {
          // Removed info toast - compression happens automatically in background
          fileToUpload = await compressImage(file, {
            maxWidth: 1500,
            maxHeight: 1500,
            quality: 0.85,
            maxSizeMB: 1,
          });
          console.log("Profile image compressed:", `${fileToUpload.name}: ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB`);
        } catch (error) {
          console.error("Compression error, uploading original:", error);
          fileToUpload = file;
        }
      }

      // Use centralized axios instance to avoid token conflicts

      const fd = new FormData();
      fd.append("files", fileToUpload);

      // Use same upload method as AddOffer with timeout
      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000, // 30 second timeout
      });

      console.log("Upload response:", res.data);
      
      // Handle response exactly like AddOffer does
      const data = res.data as any[];
      if (!data || data.length === 0) {
        throw new Error("Invalid upload response - no data");
      }

      const uploaded = data[0];
      
      // Extract filename - normalize to include /storage/ prefix for backend storage
      let filename = uploaded.filename || uploaded.path || "";
      
      if (!filename) {
        console.error("Upload response structure:", uploaded);
        throw new Error("Could not extract filename from upload response");
      }

      // Normalize filename: if it's a bare filename (no leading slash), add /storage/ prefix
      // This ensures getImage() will correctly resolve it to the backend URL
      if (filename && !filename.startsWith("/") && !filename.startsWith("http://") && !filename.startsWith("https://")) {
        filename = `/storage/${filename}`;
      } else if (filename && !filename.startsWith("/storage/") && !filename.startsWith("http://") && !filename.startsWith("https://")) {
        // If it starts with / but not /storage/, check if it should be /storage/
        // For backend storage files, we want /storage/ prefix
        filename = `/storage${filename}`;
      }

      console.log("✅ Upload successful! Setting profile image to:", filename);
      console.log("✅ Upload response full:", uploaded);
      setProfileImage(filename);
      // Removed success toast - user can see the image in preview
    } catch (error: any) {
      console.error("Error uploading image:", error);
      console.error("Error response:", error?.response?.data);
      const errorMsg = sanitizeErrorMessage(error, {
        action: "upload profile image",
        defaultMessage: "Unable to upload image. Please check the file and try again."
      });
      setLocalFile(null);
      setProfileImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.username.trim()) {
      return;
    }

    if (!formData.phoneNumber.trim()) {
      return;
    }

    const normalizedPhone = formData.phoneNumber.trim();
    if (!/^\d{8}$/.test(normalizedPhone)) {
      return;
    }

    if (!formData.mapsLink.trim()) {
      return;
    }

    setSaving(true);
    try {
      console.log("🔍 handleSave - profileImage value:", profileImage);
      console.log("🔍 handleSave - profileImage type:", typeof profileImage);
      console.log("🔍 handleSave - profileImage truthy check:", !!profileImage);
      console.log("🔍 handleSave - profileImage !== null:", profileImage !== null);
      console.log("🔍 handleSave - profileImage !== undefined:", profileImage !== undefined);
      
      const saveData = {
        username: formData.username.trim(),
        phoneNumber: normalizedPhone,
        mapsLink: formData.mapsLink.trim(),
        location: location || undefined,
        // Pass profileImage if it exists (even if empty string, let backend handle it)
        profileImage: (profileImage !== null && profileImage !== undefined) ? profileImage : undefined,
      };
      
      console.log("🔍 handleSave - saveData.profileImage:", saveData.profileImage);
      console.log("🔍 handleSave - Full saveData:", saveData);
      
      await onSave(saveData);
      onOpenChange(false);
    } catch (error) {
      // Error handled by onSave - don't close dialog on error
      console.error("Error in handleSave:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl lg:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-white p-4 sm:p-5 md:p-6">
        <DialogHeader className="flex-shrink-0 mb-3 sm:mb-4">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold text-foreground">{t("provider.profile.edit_dialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-0 overflow-y-auto pr-1">
          {/* Username */}
          <div>
            <label className="text-[10px] sm:text-xs font-medium text-foreground mb-1 block">
              {t("provider.profile.edit_dialog.username")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder={t("provider.profile.edit_dialog.store_name")}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t("provider.profile.edit_dialog.store_name_hint")}</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-[10px] sm:text-xs font-medium text-foreground mb-1 block">
              {t("provider.profile.edit_dialog.phone_number")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
              placeholder="12345678"
              maxLength={8}
              type="tel"
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{t("provider.profile.edit_dialog.phone_hint")}</p>
          </div>

          {/* Profile Image Upload - Full Width */}
          <div className="lg:col-span-2">
            <label className="text-[10px] sm:text-xs font-medium text-foreground mb-1 block">
              {t("provider.profile.edit_dialog.profile_image")}
            </label>
            <FileUploader
              value={localFile ? [localFile] : []}
              onValueChange={handleImageUpload}
              dropzoneOptions={{
                accept: { "image/*": [".jpg", ".jpeg", ".png"] },
                multiple: false,
                maxFiles: 1,
                maxSize: 5 * 1024 * 1024,
              }}
            >
              <FileInput>
                <div className="flex flex-col items-center justify-center h-24 w-full border-2 border-dashed border-border bg-white hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer">
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin text-2xl mb-2">⏳</div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs">{t("provider.profile.edit_dialog.uploading")}</p>
                    </>
                  ) : profileImage || localFile ? (
                    <>
                      <div className="text-2xl mb-2">✓</div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs">{t("provider.profile.edit_dialog.image_ready")}</p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl mb-2">📸</div>
                      <p className="text-muted-foreground text-[10px] sm:text-xs">{t("provider.profile.edit_dialog.click_to_upload")}</p>
                    </>
                  )}
                </div>
              </FileInput>
              <FileUploaderContent>
                {localFile && (() => {
                  // Determine image source - prefer uploaded image URL, fallback to local file preview
                  let imageSrc: string;
                  if (profileImage && typeof profileImage === 'string') {
                    // Use uploaded image URL
                    const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
                    if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
                      imageSrc = profileImage;
                    } else if (profileImage.startsWith("/storage/") && backendUrl) {
                      imageSrc = `${backendUrl}${profileImage}`;
                    } else if (backendUrl) {
                      imageSrc = `${backendUrl}/storage/${profileImage.replace(/^\/storage\//, '')}`;
                    } else {
                      imageSrc = profileImage;
                    }
                    // Add cache buster
                    if (!imageSrc.includes("?") && !imageSrc.includes("#")) {
                      imageSrc += `?t=${Date.now()}`;
                    }
                  } else {
                    // Use local file preview
                    imageSrc = URL.createObjectURL(localFile);
                  }
                  
                  const isUploaded = !!profileImage;
                  
                  return (
                    <FileUploaderItem
                      index={0}
                      className={`size-24 p-0 rounded-xl overflow-hidden border-2 shadow-sm relative ${
                        isUploaded ? "border-emerald-600" : "border-yellow-400"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <Image
                          src={imageSrc}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover rounded-xl"
                          unoptimized={true}
                        />
                      </div>
                      <div className={`absolute top-1 right-1 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full z-10 ${
                        isUploaded 
                          ? "bg-emerald-600" 
                          : uploadingImage 
                          ? "bg-yellow-500" 
                          : "bg-yellow-400"
                      }`}>
                        {isUploaded ? "✓" : uploadingImage ? "⏳" : "📤"}
                      </div>
                    </FileUploaderItem>
                  );
                })()}
              </FileUploaderContent>
            </FileUploader>
            <p className="text-xs text-muted-foreground mt-1">{t("provider.profile.edit_dialog.upload_logo")}</p>
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="text-[10px] sm:text-xs font-medium text-foreground mb-1 block">
              {t("provider.profile.edit_dialog.maps_link")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.mapsLink}
              onChange={handleMapsLinkChange}
              onPaste={handlePaste}
              placeholder={t("provider.profile.edit_dialog.maps_placeholder")}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {t("provider.profile.edit_dialog.maps_hint")}
            </p>
          </div>

          {/* Location Name */}
          <div>
            <label className="text-[10px] sm:text-xs font-medium text-foreground mb-1 block">
              {t("provider.profile.edit_dialog.location_name")}
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("provider.profile.edit_dialog.location_auto")}
              className="text-xs sm:text-sm py-2 sm:py-2.5"
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {t("provider.profile.edit_dialog.location_hint")}
            </p>
          </div>
        </div>
        <DialogFooter className="lg:col-span-2 gap-2 sm:gap-3 pt-4 border-t border-border bg-white flex-shrink-0 mt-auto">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || uploadingImage}
            className="w-full sm:w-auto"
          >
            {t("common.cancel")}
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || uploadingImage}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {saving ? t("common.saving") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ProviderProfile() {
  const router = useRouter();
  const { t } = useLanguage();
  const { profile, stats, loading, refetch } = useProviderProfile();

  // Prevent overscroll bounce on mobile
  useEffect(() => {
    const body = document.body;
    body.style.touchAction = "pan-x pan-y";
    
    return () => {
      body.style.touchAction = "";
    };
  }, []);

  const getProfileImageSrc = () => {
    if (!profile?.profileImage) return DEFAULT_PROFILE_IMAGE;
    if (typeof profile.profileImage === "string") {
      return resolveImageSource(profile.profileImage);
    }
    if (typeof profile.profileImage === "object" && "url" in profile.profileImage) {
      return resolveImageSource({ url: String(profile.profileImage.url) });
    }
    return DEFAULT_PROFILE_IMAGE;
  };

  const profileImageSrc = getProfileImageSrc();

  const handleSaveProfile = async (data: {
    username: string;
    phoneNumber: string;
    mapsLink: string;
    location?: string;
    profileImage?: string;
  }) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      // Build payload
      const payload: any = {
        username: data.username.trim(),
        phoneNumber: parseInt(data.phoneNumber, 10), // Convert to integer as per schema
        mapsLink: data.mapsLink.trim(),
      };

      // Include location if extracted (backend might also extract it, but sending it ensures it's set)
      if (data.location && data.location.trim()) {
        payload.location = data.location.trim();
      }

      // Include profile image if uploaded - always send if provided
      // Check for both truthy value and non-empty string
      if (data.profileImage !== undefined && data.profileImage !== null) {
        const imageValue = String(data.profileImage).trim();
        if (imageValue) {
          // Send the image value as-is - it could be:
          // - Just filename: "image.jpg"
          // - Path: "/storage/image.jpg"
          // - Full URL path: "/storage/image.jpg"
          // Backend should handle all formats
          payload.profileImage = imageValue;
          console.log("✅ Sending profileImage to backend:", payload.profileImage);
          console.log("✅ ProfileImage type:", typeof payload.profileImage);
          console.log("✅ ProfileImage length:", payload.profileImage.length);
        } else {
          console.log("⚠️ ProfileImage is empty string, not sending");
        }
      } else {
        console.log("⚠️ No profileImage to send");
        console.log("⚠️ ProfileImage value:", data.profileImage);
        console.log("⚠️ ProfileImage type:", typeof data.profileImage);
      }

      console.log("📤 Updating profile with payload:", JSON.stringify(payload, null, 2));

      // Use POST method to update profile
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Refetch to get updated data
      await refetch();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      console.error("Error response:", err?.response?.data);
      const errorMsg = sanitizeErrorMessage(err, {
        action: "update profile",
        defaultMessage: t("provider.profile.edit_dialog.update_failed") || "Unable to update profile. Please try again."
      });
      throw err;
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden pb-20 sm:pb-24 lg:pb-6 px-4 pt-6 sm:pt-8 md:pt-10 lg:pt-12 flex flex-col">
      <h1 className="font-display font-bold text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-4 flex-shrink-0">{t("profile.title") || "Profile"}</h1>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
      {/* User Info */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-border shadow-sm mb-3 sm:mb-4 flex items-center gap-3 sm:gap-4 flex-shrink-0">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-lg sm:text-xl md:text-2xl font-bold overflow-hidden flex-shrink-0">
          <Image
            src={sanitizeImageUrl(profileImageSrc)}
            alt={profile?.username || "Store"}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(profileImageSrc))}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base sm:text-lg md:text-xl truncate">{loading ? t("common.loading") : profile?.username || t("provider.profile.your_store")}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm truncate">{profile?.location || t("provider.profile.location")}</p>
        </div>
      </div>

      {/* Impact Stats - Simplified */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-6 mb-1 sm:mb-2" />
          <div className="text-lg sm:text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalOffers}</div>
          <div className="text-[9px] sm:text-[10px] md:text-xs opacity-90 leading-tight">{t("provider.profile.active_offers") || "Active Offers"}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Heart className="w-4 h-4 sm:w-5 sm:h-6 mb-1 sm:mb-2" />
          <div className="text-lg sm:text-xl md:text-2xl font-bold">{loading ? "..." : stats.totalMealsSaved}</div>
          <div className="text-[9px] sm:text-[10px] md:text-xs opacity-90 leading-tight">{t("provider.profile.meals_saved") || "Meals Saved"}</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <svg className="w-4 h-4 sm:w-5 sm:h-6 mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-lg sm:text-xl md:text-2xl font-bold">{loading ? "..." : `${stats.revenue.toFixed(0)}`}</div>
          <div className="text-[9px] sm:text-[10px] md:text-xs opacity-90 leading-tight">{t("provider.profile.total_revenue") || "Revenue (dt)"}</div>
        </div>
      </div>

      {/* Edit Profile Button */}
      <div className="mb-3 sm:mb-4">
        <Link href="/provider/profile/edit" className="block">
          <button className="w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl border transition-all group active:scale-[0.99]">
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Settings size={16} className="sm:w-5 sm:h-5" />
              </div>
              <span className="font-medium text-xs sm:text-sm md:text-base">{t("provider.profile.edit_profile") || "Edit Personal Details"}</span>
            </div>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 group-hover:text-white transition-colors" />
          </button>
        </Link>
      </div>

      {/* Menu */}
      <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
        <Link href="/provider/impact" className="block">
          <MenuItem icon={Heart} label={t("nav.impact") || "Impact"} />
        </Link>
        <Link href="/provider/contact" className="block">
          <MenuItem icon={MessageCircle} label={t("nav.contact") || "Contact"} />
        </Link>
        <Link href="/provider/profile/preferences" className="block">
          <MenuItem icon={Settings} label={t("common.preferences") || "Preferences"} />
        </Link>
      </div>

      {/* Sign Out */}
      <button
        onClick={() => {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          router.push("/");
        }}
        className="w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 hover:bg-destructive/20 transition-all active:scale-[0.99] font-medium text-xs sm:text-sm mb-2 sm:mb-3"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        {t("common.signOut") || "Sign Out"}
      </button>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-2.5 sm:p-3 md:p-4 bg-white rounded-lg sm:rounded-xl border border-border hover:border-primary/50 transition-all group active:scale-[0.99]"
    >
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
        <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-secondary/50 flex items-center justify-center text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <Icon size={16} className="sm:w-5 sm:h-5" />
        </div>
        <span className="font-medium text-xs sm:text-sm md:text-base">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
}
