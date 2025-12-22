"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Mail, Phone, CheckCircle2, XCircle, Send, MapPin, Link as LinkIcon, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/context/LanguageContext";
import axios from "axios";
import { axiosInstance } from "@/lib/axiosInstance";
import Image from "next/image";
import { sanitizeImageUrl, shouldUnoptimizeImage, resolveImageSource } from "@/utils/imageUtils";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { compressImage, shouldCompress } from "@/utils/imageCompression";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import { useBlobUrl } from "@/hooks/useBlobUrl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_PROFILE_IMAGE = "/logo.png";

export default function AccountDetails() {
  const router = useRouter();
  const { t } = useLanguage();
  const { createBlobUrl, revokeBlobUrl } = useBlobUrl();
  const profileBlobUrlRef = React.useRef<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    mapsLink: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

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

        const { username, email, phoneNumber, profileImage, emailVerified, location, mapsLink } = profileRes.data || {};
        setUsername(username || "");
        setEmail(email || "");
        setPhoneNumber(phoneNumber ? String(phoneNumber) : "");
        setEmailVerified(emailVerified || false);
        setLocation(location || "");
        setMapsLink(mapsLink || "");
        setFormData({
          username: username || "",
          phoneNumber: phoneNumber ? String(phoneNumber) : "",
          mapsLink: mapsLink || "",
        });
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
  }, [router, t]);

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
          timeout: 10000,
        }
      );

      const { locationName } = response.data;
      if (locationName) {
        setLocation(locationName);
      }
    } catch (error: any) {
      console.error("Error extracting location name:", error);
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
      // Revoke blob URL when clearing
      if (profileBlobUrlRef.current) {
        revokeBlobUrl(profileBlobUrlRef.current);
        profileBlobUrlRef.current = null;
      }
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
      // Revoke blob URL once image is uploaded
      if (profileBlobUrlRef.current) {
        revokeBlobUrl(profileBlobUrlRef.current);
        profileBlobUrlRef.current = null;
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      // Revoke blob URL on error
      if (profileBlobUrlRef.current) {
        revokeBlobUrl(profileBlobUrlRef.current);
        profileBlobUrlRef.current = null;
      }
      setLocalFile(null);
      setProfileImage(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.username.trim()) {
      toast.error(t("provider.profile.edit_dialog.username") || "Username is required");
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error(t("provider.profile.edit_dialog.phone_number") || "Phone number is required");
      return;
    }

    const normalizedPhone = formData.phoneNumber.trim();
    if (!/^\d{8}$/.test(normalizedPhone)) {
      toast.error(t("provider.profile.edit_dialog.phone_hint") || "Phone number must be 8 digits");
      return;
    }

    if (!formData.mapsLink.trim()) {
      toast.error(t("provider.profile.edit_dialog.maps_link") || "Maps link is required");
      return;
    }

    setIsSaving(true);
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

      await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsername(formData.username);
      setPhoneNumber(formData.phoneNumber);
      setMapsLink(formData.mapsLink);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      const errorMsg = sanitizeErrorMessage(err, {
        action: "update profile",
        defaultMessage: t("provider.profile.edit_dialog.update_failed") || "Failed to save"
      });
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      setSendingVerification(true);

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/send-verification-email`,
        { email },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Verification email sent! Check your inbox for the verification link or code.");
      setShowVerifyDialog(true);
    } catch (err: any) {
      console.error("Failed to send verification email:", err);
      const errorMsg = err?.response?.data?.error || "Failed to send verification email";
      toast.error(errorMsg);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    setVerifyingCode(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-email-code`,
        {
          email: email.trim(),
          code: verificationCode.trim(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.verified) {
        setEmailVerified(true);
        setShowVerifyDialog(false);
        setVerificationCode("");
        toast.success("Email verified successfully!");
        
        // Refresh profile data
        const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { emailVerified: newEmailVerified } = profileRes.data || {};
        setEmailVerified(newEmailVerified || false);
      } else {
        toast.error("Invalid verification code. Please try again.");
      }
    } catch (err: any) {
      console.error("Error verifying code:", err);
      const errorMsg = err?.response?.data?.error || 
                      err?.response?.data?.message || 
                      "Invalid verification code. Please try again.";
      toast.error(errorMsg);
    } finally {
      setVerifyingCode(false);
    }
  };

  const getProfileImageSrc = () => {
    if (profileImage && localFile) {
      const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
        return profileImage;
      } else if (profileImage.startsWith("/storage/") && backendUrl) {
        return `${backendUrl}${profileImage}`;
      } else if (backendUrl) {
        return `${backendUrl}/storage/${profileImage.replace(/^\/storage\//, '')}`;
      }
    } else if (localFile) {
      // Get or create blob URL for local file
      if (!profileBlobUrlRef.current) {
        profileBlobUrlRef.current = createBlobUrl(localFile);
      }
      return profileBlobUrlRef.current || DEFAULT_PROFILE_IMAGE;
    } else if (profileImage) {
      if (typeof profileImage === "string") {
        return resolveImageSource(profileImage);
      }
    }
    return DEFAULT_PROFILE_IMAGE;
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayName = username || email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-24 px-4 pt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/provider/profile")}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="font-display font-bold text-3xl">{t("profile.accountDetails") || "Account Details"}</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
            <Image
              src={sanitizeImageUrl(getProfileImageSrc())}
              alt={displayName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(getProfileImageSrc()))}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = DEFAULT_PROFILE_IMAGE;
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl">{displayName}</h2>
            <p className="text-muted-foreground text-sm">{email}</p>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("provider.profile.edit_dialog.profile_image") || "Profile Image"}
              </label>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  <Image
                    src={sanitizeImageUrl(getProfileImageSrc())}
                    alt={formData.username || "Profile"}
                    width={64}
                    height={64}
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
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("provider.profile.edit_dialog.username") || "Store Name"} <span className="text-red-500">*</span>
              </label>
              <input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={t("provider.profile.edit_dialog.store_name") || "Your store name"}
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("provider.profile.edit_dialog.store_name_hint") || "This is how customers will see your store"}</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("provider.profile.edit_dialog.phone_number") || "Phone Number"} <span className="text-red-500">*</span>
              </label>
              <input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="12345678"
                maxLength={8}
                type="tel"
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("provider.profile.edit_dialog.phone_hint") || "8 digits (e.g., 12345678)"}</p>
            </div>

            {/* Google Maps Link */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("provider.profile.edit_dialog.maps_link") || "Google Maps Link"} <span className="text-red-500">*</span>
              </label>
              <input
                name="mapsLink"
                value={formData.mapsLink}
                onChange={handleMapsLinkChange}
                onPaste={handlePaste}
                placeholder={t("provider.profile.edit_dialog.maps_placeholder") || "Paste your Google Maps link here"}
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("provider.profile.edit_dialog.maps_hint") || "Paste your store's Google Maps link"}
              </p>
            </div>

            {/* Location Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("provider.profile.edit_dialog.location_name") || "Location Name"}
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t("provider.profile.edit_dialog.location_auto") || "Auto-filled from Maps link"}
                className="w-full p-3 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("provider.profile.edit_dialog.location_hint") || "Location will be auto-extracted from Maps link"}
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving || uploadingImage}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    {t("common.saved") || "Saved"}
                  </>
                ) : isSaving ? (
                  t("common.saving") || "Saving..."
                ) : (
                  t("common.save") || "Save"
                )}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ username, phoneNumber, mapsLink });
                }}
                className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                {t("common.cancel") || "Cancel"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
              <User className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("client.profile.username") || "Username"}</p>
                <p className="font-medium">{username || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{email || "-"}</p>
                  </div>
                  {emailVerified ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">Not Verified</span>
                    </div>
                  )}
                </div>
                {!emailVerified && (
                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      onClick={handleResendVerification}
                      disabled={sendingVerification}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 disabled:opacity-50"
                    >
                      <Send className="w-3 h-3" />
                      {sendingVerification ? "Sending..." : "Send Verification Email"}
                    </button>
                    <button
                      onClick={() => setShowVerifyDialog(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Or enter verification code
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{t("client.profile.phone_number") || "Phone Number"}</p>
                <p className="font-medium">{phoneNumber || "-"}</p>
              </div>
            </div>
            {location && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t("provider.profile.edit_dialog.location_name") || "Location"}</p>
                  <p className="font-medium">{location || "-"}</p>
                </div>
              </div>
            )}
            {mapsLink && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border">
                <LinkIcon className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{t("provider.profile.edit_dialog.maps_link") || "Google Maps Link"}</p>
                  <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline truncate block">
                    {mapsLink}
                  </a>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              {t("common.edit") || "Edit"}
            </button>
          </div>
        )}
      </div>

      {/* Verification Code Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Verify Your Email</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to <strong>{email}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="000000"
                className="w-full p-4 text-center text-2xl font-bold tracking-widest border-2 border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:outline-none text-foreground bg-white"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowVerifyDialog(false);
                  setVerificationCode("");
                }}
                className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={verifyingCode || verificationCode.length !== 6}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {verifyingCode ? "Verifying..." : "Verify"}
              </button>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={sendingVerification}
              className="w-full text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
            >
              {sendingVerification ? "Sending..." : "Resend code"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
