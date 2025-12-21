"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import { sanitizeImageUrl, shouldUnoptimizeImage, resolveImageSource } from "@/utils/imageUtils";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { compressImage, shouldCompress } from "@/utils/imageCompression";

const DEFAULT_PROFILE_IMAGE = "/logo.png";

interface ProfileData {
  username: string;
  location: string;
  phoneNumber: string;
  mapsLink?: string;
  profileImage?: string | { url?: string };
}

export default function EditProviderProfile() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    mapsLink: "",
  });
  const [location, setLocation] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/signIn");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers });

        const { username, location, phoneNumber, profileImage, mapsLink } = profileRes.data || {};
        setProfile({
          username: username || "",
          location: location || "",
          phoneNumber: phoneNumber ? String(phoneNumber) : "",
          mapsLink: mapsLink || "",
          profileImage: profileImage ?? undefined,
        });
        setFormData({
          username: username || "",
          phoneNumber: phoneNumber ? String(phoneNumber) : "",
          mapsLink: mapsLink || "",
        });
        setLocation(location || "");
        
        // Set profile image if exists
        if (profileImage) {
          setProfileImage(typeof profileImage === 'string' ? profileImage : profileImage.url || null);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // Clean and extract Google Maps URL from pasted text
  const cleanGoogleMapsUrl = (text: string): string => {
    if (!text.trim()) return "";
    
    text = text.trim();
    
    const urlPattern = /(https?:\/\/)?(www\.)?(maps\.)?(google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|maps\.google\.com)[^\s]*/gi;
    const urlMatch = text.match(urlPattern);
    if (urlMatch && urlMatch[0]) {
      let url = urlMatch[0];
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      url = url.replace(/[.,;!?]+$/, "");
      return url;
    }
    
    const shortLinkPattern = /(https?:\/\/)?(goo\.gl|maps\.app\.goo\.gl)\/[a-zA-Z0-9]+/gi;
    const shortMatch = text.match(shortLinkPattern);
    if (shortMatch && shortMatch[0]) {
      let url = shortMatch[0];
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      return url;
    }
    
    return text;
  };

  // Extract location from Google Maps link
  const fetchLocationName = async (url: string) => {
    if (!url.trim()) {
      return;
    }

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
        // Use alert as fallback since this page might not have toast setup
        console.warn(
          "Location extraction failed:",
          isNetworkError 
            ? "Network error - please check your connection"
            : "Server error - please try again later"
        );
      }
    }
  };

  const handleMapsLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const cleanedUrl = cleanGoogleMapsUrl(inputValue);
    setFormData((prev) => ({ ...prev, mapsLink: cleanedUrl || inputValue }));
    fetchLocationName(cleanedUrl || inputValue);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const cleanedUrl = cleanGoogleMapsUrl(pastedText);
    if (cleanedUrl && cleanedUrl !== pastedText) {
      e.preventDefault();
      setFormData((prev) => ({ ...prev, mapsLink: cleanedUrl }));
      fetchLocationName(cleanedUrl);
    }
  };

  // Handle profile image upload
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
        return;
      }

      let fileToUpload = file;
      if (shouldCompress(file, 1)) {
        try {
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

      const fd = new FormData();
      fd.append("files", fileToUpload);

      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      const data = res.data as any[];
      if (!data || data.length === 0) {
        throw new Error("Invalid upload response - no data");
      }

      const uploaded = data[0];
      let filename = uploaded.filename || uploaded.path || "";
      
      if (!filename) {
        throw new Error("Could not extract filename from upload response");
      }

      if (filename && !filename.startsWith("/") && !filename.startsWith("http://") && !filename.startsWith("https://")) {
        filename = `/storage/${filename}`;
      } else if (filename && !filename.startsWith("/storage/") && !filename.startsWith("http://") && !filename.startsWith("https://")) {
        filename = `/storage${filename}`;
      }

      setProfileImage(filename);
    } catch (error: any) {
      console.error("Error uploading image:", error);
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
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const payload: any = {
        username: formData.username.trim(),
        phoneNumber: parseInt(normalizedPhone, 10),
        mapsLink: formData.mapsLink.trim(),
      };

      if (location && location.trim()) {
        payload.location = location.trim();
      }

      if (profileImage !== null && profileImage !== undefined) {
        const imageValue = String(profileImage).trim();
        if (imageValue) {
          payload.profileImage = imageValue;
        }
      }

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

      // Navigate back to profile page
      router.push("/provider/profile");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      const errorMsg = sanitizeErrorMessage(err, {
        action: "update profile",
        defaultMessage: t("provider.profile.edit_dialog.update_failed") || "Unable to update profile. Please try again."
      });
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getProfileImageSrc = () => {
    if (profileImage && localFile) {
      // Show uploaded image
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
        return profileImage;
      } else if (profileImage.startsWith("/storage/") && backendUrl) {
        return `${backendUrl}${profileImage}`;
      } else if (backendUrl) {
        return `${backendUrl}/storage/${profileImage.replace(/^\/storage\//, '')}`;
      }
    } else if (localFile) {
      // Show local preview
      return URL.createObjectURL(localFile);
    } else if (profile?.profileImage) {
      // Show existing profile image
      if (typeof profile.profileImage === "string") {
        return resolveImageSource(profile.profileImage);
      }
      if (typeof profile.profileImage === "object" && "url" in profile.profileImage) {
        return resolveImageSource({ url: String(profile.profileImage.url) });
      }
    }
    return DEFAULT_PROFILE_IMAGE;
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 sm:pb-24 lg:pb-6 px-4 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => router.push("/provider/profile")}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-emerald-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-display font-bold text-xl sm:text-2xl md:text-3xl">
          {t("provider.profile.edit_dialog.title") || "Edit Profile"}
        </h1>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border shadow-sm max-w-2xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Image Upload */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-foreground mb-2 sm:mb-3">
              {t("provider.profile.edit_dialog.profile_image") || "Profile Image"}
            </label>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image
                  src={sanitizeImageUrl(getProfileImageSrc())}
                  alt={formData.username || "Profile"}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(getProfileImageSrc()))}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
              </div>
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
                        <p className="text-muted-foreground text-xs">{t("provider.profile.edit_dialog.uploading") || "Uploading..."}</p>
                      </>
                    ) : profileImage || localFile ? (
                      <>
                        <div className="text-2xl mb-2">✓</div>
                        <p className="text-muted-foreground text-xs">{t("provider.profile.edit_dialog.image_ready") || "Image Ready"}</p>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl mb-2">📸</div>
                        <p className="text-muted-foreground text-xs">{t("provider.profile.edit_dialog.click_to_upload") || "Click to upload"}</p>
                      </>
                    )}
                  </div>
                </FileInput>
                <FileUploaderContent>
                  {localFile && (
                    <FileUploaderItem
                      index={0}
                      className={`size-24 p-0 rounded-xl overflow-hidden border-2 shadow-sm relative ${
                        profileImage ? "border-emerald-600" : "border-yellow-400"
                      }`}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <Image
                          src={getProfileImageSrc()}
                          alt="Profile"
                          width={96}
                          height={96}
                          className="w-full h-full object-cover rounded-xl"
                          unoptimized={true}
                        />
                      </div>
                      <div className={`absolute top-1 right-1 text-white text-xs px-1.5 py-0.5 rounded-full z-10 ${
                        profileImage 
                          ? "bg-emerald-600" 
                          : uploadingImage 
                          ? "bg-yellow-500" 
                          : "bg-yellow-400"
                      }`}>
                        {profileImage ? "✓" : uploadingImage ? "⏳" : "📤"}
                      </div>
                    </FileUploaderItem>
                  )}
                </FileUploaderContent>
              </FileUploader>
            </div>
            <p className="text-xs text-muted-foreground">{t("provider.profile.edit_dialog.upload_logo") || "Upload your store logo"}</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
              {t("provider.profile.edit_dialog.username") || "Store Name"} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder={t("provider.profile.edit_dialog.store_name") || "Your store name"}
              className="text-sm sm:text-base py-2.5 sm:py-3"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("provider.profile.edit_dialog.store_name_hint") || "This is how customers will see your store"}</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
              {t("provider.profile.edit_dialog.phone_number") || "Phone Number"} <span className="text-red-500">*</span>
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
              className="text-sm sm:text-base py-2.5 sm:py-3"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("provider.profile.edit_dialog.phone_hint") || "8 digits (e.g., 12345678)"}</p>
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
              {t("provider.profile.edit_dialog.maps_link") || "Google Maps Link"} <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.mapsLink}
              onChange={handleMapsLinkChange}
              onPaste={handlePaste}
              placeholder={t("provider.profile.edit_dialog.maps_placeholder") || "Paste your Google Maps link here"}
              className="text-sm sm:text-base py-2.5 sm:py-3"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t("provider.profile.edit_dialog.maps_hint") || "Paste your store's Google Maps link"}
            </p>
          </div>

          {/* Location Name */}
          <div>
            <label className="block text-sm sm:text-base font-semibold text-foreground mb-2">
              {t("provider.profile.edit_dialog.location_name") || "Location Name"}
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={t("provider.profile.edit_dialog.location_auto") || "Auto-filled from Maps link"}
              className="text-sm sm:text-base py-2.5 sm:py-3"
            />
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {t("provider.profile.edit_dialog.location_hint") || "Location will be auto-extracted from Maps link"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => router.push("/provider/profile")}
              disabled={saving || uploadingImage}
              className="w-full sm:w-auto"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || uploadingImage || !formData.username.trim() || !formData.phoneNumber.trim() || !formData.mapsLink.trim()}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? t("common.saving") || "Saving..." : t("common.save") || "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

