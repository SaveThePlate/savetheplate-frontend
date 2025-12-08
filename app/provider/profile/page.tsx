"use client";
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import { resolveImageSource, shouldUnoptimizeImage } from "@/utils/imageUtils";
import { useLanguage } from "@/context/LanguageContext";

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

      const userId = JSON.parse(atob(token.split(".")[1])).id;
      const headers = { Authorization: `Bearer ${token}` };

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
          { headers }
        ).then((locationRes) => {
          const extractedLocation = locationRes.data.locationName || location;
          setProfile((prev) => prev ? { ...prev, location: extractedLocation || "Location" } : null);
        }).catch((err) => {
          console.error("Failed to extract location:", err);
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
      setError(err?.response?.data?.message || "Failed to fetch data");
      toast.error(t("provider.profile.fetch_failed"));
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
      setLocation("");
      return;
    }

    // Clean the URL first
    const cleanedUrl = cleanGoogleMapsUrl(url);
    if (!cleanedUrl) {
      setLocation("");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || "";
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/extract-location`,
        { mapsLink: cleanedUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { locationName } = response.data;
      setLocation(locationName || "");
    } catch (error) {
      console.error("Error extracting location name:", error);
      setLocation("");
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
    setLocalFile(file);
    setUploadingImage(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("client.offers.detail.login_required"));
        return;
      }

      // Create axios instance with baseURL and auth interceptor (same as AddOffer)
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

      const fd = new FormData();
      fd.append("files", file);

      // Use same upload method as AddOffer
      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
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
      toast.success(t("provider.profile.edit_dialog.image_ready"));
    } catch (error: any) {
      console.error("Error uploading image:", error);
      console.error("Error response:", error?.response?.data);
      toast.error(error?.response?.data?.message || error?.message || "Failed to upload profile image");
      setLocalFile(null);
      setProfileImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.username.trim()) {
      toast.error(t("provider.profile.edit_dialog.username_required"));
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error(t("provider.profile.edit_dialog.phone_required"));
      return;
    }

    const normalizedPhone = formData.phoneNumber.trim();
    if (!/^\d{8}$/.test(normalizedPhone)) {
      toast.error(t("provider.profile.edit_dialog.phone_hint"));
      return;
    }

    if (!formData.mapsLink.trim()) {
      toast.error(t("provider.profile.edit_dialog.maps_required"));
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("provider.profile.edit_dialog.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
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
            />
            <p className="text-xs text-gray-500 mt-1">{t("provider.profile.edit_dialog.store_name_hint")}</p>
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
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
                <div className="flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                  {uploadingImage ? (
                    <>
                      <div className="animate-spin text-2xl mb-2">⏳</div>
                      <p className="text-gray-600 text-sm">{t("provider.profile.edit_dialog.uploading")}</p>
                    </>
                  ) : profileImage || localFile ? (
                    <>
                      <div className="text-2xl mb-2">✓</div>
                      <p className="text-gray-600 text-sm">{t("provider.profile.edit_dialog.image_ready")}</p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl mb-2">📸</div>
                      <p className="text-gray-600 text-sm">{t("provider.profile.edit_dialog.click_to_upload")}</p>
                    </>
                  )}
                </div>
              </FileInput>
              <FileUploaderContent>
                {localFile && (
                  <FileUploaderItem
                    index={0}
                    className="size-24 p-0 rounded-xl overflow-hidden border-2 border-emerald-200 shadow-sm"
                  >
                    <Image
                      src={URL.createObjectURL(localFile)}
                      alt="Profile"
                      width={96}
                      height={96}
                      className="size-24 object-cover rounded-xl"
                      unoptimized={true}
                    />
                  </FileUploaderItem>
                )}
              </FileUploaderContent>
            </FileUploader>
            <p className="text-xs text-gray-500 mt-1">{t("provider.profile.edit_dialog.upload_logo")}</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
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
            />
            <p className="text-xs text-gray-500 mt-1">{t("provider.profile.edit_dialog.phone_hint")}</p>
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("provider.profile.edit_dialog.maps_link")} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.mapsLink}
              onChange={handleMapsLinkChange}
              onPaste={handlePaste}
              placeholder={t("provider.profile.edit_dialog.maps_placeholder")}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("provider.profile.edit_dialog.maps_hint")}
            </p>
          </div>

          {/* Detected Location */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              {t("provider.profile.edit_dialog.detected_location")}
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-gray-50 text-gray-600"
              placeholder={t("provider.profile.edit_dialog.location_auto")}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("provider.profile.edit_dialog.location_hint")}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || uploadingImage}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || uploadingImage}>
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

      toast.success(t("provider.profile.edit_dialog.profile_updated"));
      // Refetch to get updated data
      await refetch();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      console.error("Error response:", err?.response?.data);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("provider.profile.edit_dialog.update_failed");
      toast.error(errorMessage);
      throw err;
    }
  };

  return (
    <main className="bg-[#F9FAF5] min-h-screen pt-24 pb-20 flex flex-col items-center px-4">
      <ToastContainer
        position="top-right"
        autoClose={1000}
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

      {/* Profile Card */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Profile Header Section */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 px-6 md:px-8 py-6 md:py-8 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Profile Image */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-lg ring-4 ring-emerald-100">
                <Image
                  src={profileImageSrc}
                  alt="Store Logo"
                  width={112}
                  height={112}
                  className="object-cover w-full h-full"
                  unoptimized={shouldUnoptimizeImage(profileImageSrc)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
              </div>
            </div>

            {/* Store Details */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {loading ? t("common.loading") : profile?.username || t("provider.profile.your_store")}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm md:text-base">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{loading ? "..." : profile?.location || t("provider.profile.location")}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{loading ? "..." : profile?.phoneNumber || t("provider.profile.phone_number")}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Link href="/provider/publish" className="sm:w-auto">
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t("provider.profile.create_offer")}
                </Button>
              </Link>
              <Button
                onClick={() => setIsEditModalOpen(true)}
                variant="outline"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t("provider.profile.edit_profile")}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Number of Offers */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-emerald-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide">{t("provider.profile.offers")}</p>
                  <p className="text-3xl font-bold text-emerald-800">
                    {loading ? "..." : stats.totalOffers}
                  </p>
                </div>
              </div>
              <p className="text-xs text-emerald-700 mt-1">{t("provider.profile.published_offers")}</p>
            </div>

            {/* Number of Items */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-blue-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{t("provider.profile.items")}</p>
                  <p className="text-3xl font-bold text-blue-800">
                    {loading ? "..." : stats.totalItems}
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-1">{t("provider.profile.total_items_available")}</p>
            </div>

            {/* Generated Revenue */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-xl p-5 border border-amber-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg bg-amber-200 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide">{t("provider.profile.revenue")}</p>
                  <p className="text-3xl font-bold text-amber-800">
                    {loading ? "..." : stats.revenue.toFixed(2)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-1">{t("provider.profile.total_earnings")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact Section */}
      <div className="w-full max-w-2xl mt-8">
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center">
                <span className="text-3xl">🌱</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-teal-900">{t("provider.profile.environmental_impact")}</h2>
                <p className="text-sm text-teal-700">{t("provider.profile.contribution")}</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/impact")}
              className="bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-teal-700 text-sm"
            >
              {t("provider.profile.learn_more")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Meals Saved */}
            <div className="bg-white rounded-xl p-5 border border-teal-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <span className="text-xl">🍽️</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("provider.profile.meals_saved")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.totalMealsSaved}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {t("provider.profile.food_rescued")}
              </p>
            </div>

            {/* CO2 Saved */}
            <div className="bg-white rounded-xl p-5 border border-teal-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <span className="text-xl">🌍</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("provider.profile.co2_saved")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.co2Saved.toFixed(1)} kg
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {t("provider.profile.equivalent_trees", { trees: loading ? "..." : (stats.co2Saved / 21).toFixed(1) })}
              </p>
            </div>

            {/* Water Saved */}
            <div className="bg-white rounded-xl p-5 border border-teal-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                  <span className="text-xl">💧</span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">{t("provider.profile.water_saved")}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "..." : stats.waterSaved >= 1000 ? `${(stats.waterSaved / 1000).toFixed(1)}k` : stats.waterSaved.toFixed(0)} L
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {t("provider.profile.water_footprint")}
              </p>
            </div>
          </div>

          {/* Impact Message */}
          {!loading && stats.totalMealsSaved > 0 && (
            <div className="mt-6 p-4 bg-teal-100 rounded-xl border border-teal-300">
              <p className="text-sm text-teal-900 font-medium text-center">
                {t("provider.profile.impact_message", { 
                  meals: stats.totalMealsSaved, 
                  plural: stats.totalMealsSaved !== 1 ? "s" : "",
                  co2: stats.co2Saved.toFixed(1),
                  water: stats.waterSaved >= 1000 ? `${(stats.waterSaved / 1000).toFixed(1)}k` : stats.waterSaved.toFixed(0)
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </main>
  );
}
