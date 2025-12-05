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
import { resolveImageSource } from "@/utils/imageUtils";

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

const DEFAULT_PROFILE_IMAGE = "/logo.png";

// Custom hook for fetching profile and stats
const useProviderProfile = () => {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({
    totalOffers: 0,
    totalItems: 0,
    revenue: 0,
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

      // Fetch profile
      const profileRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { username, location, phoneNumber, profileImage, mapsLink } =
        profileRes.data || {};
      
      // If location is not set but mapsLink exists, try to extract it
      let finalLocation = location;
      if (!finalLocation && mapsLink) {
        try {
          const locationRes = await axios.post(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/extract-location`,
            { mapsLink },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          finalLocation = locationRes.data.locationName || location;
        } catch (err) {
          console.error("Failed to extract location:", err);
          // Use existing location or fallback
        }
      }
      
      setProfile({
        username: username || "Username",
        location: finalLocation || "Location",
        phoneNumber: phoneNumber ? String(phoneNumber) : "Phone number",
        mapsLink: mapsLink || "",
        profileImage: profileImage ?? undefined,
      });

      // Fetch offers for stats
      const userId = JSON.parse(atob(token.split(".")[1])).id;
      const offersRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/owner/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const offers = offersRes.data || [];
      const totalOffers = offers.length;
      const totalItems = offers.reduce(
        (sum: number, o: any) => sum + (o.quantity ?? 0),
        0
      );

      // Fetch orders to calculate revenue
      const ordersRes = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/provider`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const orders: Order[] = ordersRes.data || [];
      const confirmedOrders = orders.filter((o) => o.status === "confirmed");
      
      // Calculate revenue: sum of (quantity * price) for all confirmed orders
      const revenue = confirmedOrders.reduce((sum, order) => {
        const price = order.offer?.price || 0;
        return sum + order.quantity * price;
      }, 0);

      setStats({
        totalOffers,
        totalItems,
        revenue,
      });
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      setError(err?.response?.data?.message || "Failed to fetch data");
      toast.error("Failed to fetch profile or stats");
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  // Extract location from Google Maps link
  const fetchLocationName = async (url: string) => {
    if (!url.trim()) {
      setLocation("");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || "";
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/extract-location`,
        { mapsLink: url },
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
    const url = e.target.value;
    setFormData((prev) => ({ ...prev, mapsLink: url }));
    fetchLocationName(url);
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
        toast.error("Authentication required");
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
      toast.success("Profile image uploaded!");
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
      toast.error("Username is required");
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    const normalizedPhone = formData.phoneNumber.trim();
    if (!/^\d{8}$/.test(normalizedPhone)) {
      toast.error("Please enter a valid phone number (8 digits).");
      return;
    }

    if (!formData.mapsLink.trim()) {
      toast.error("Google Maps link is required");
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
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Username */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Username <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  username: e.target.value,
                }))
              }
              placeholder="Your store name"
            />
            <p className="text-xs text-gray-500 mt-1">This will be displayed as your store name</p>
          </div>

          {/* Profile Image Upload */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Profile Image
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
                      <p className="text-gray-600 text-sm">Uploading...</p>
                    </>
                  ) : profileImage || localFile ? (
                    <>
                      <div className="text-2xl mb-2">✓</div>
                      <p className="text-gray-600 text-sm">Image ready</p>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl mb-2">📸</div>
                      <p className="text-gray-600 text-sm">Click to upload</p>
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
                    />
                  </FileUploaderItem>
                )}
              </FileUploaderContent>
            </FileUploader>
            <p className="text-xs text-gray-500 mt-1">Upload your store logo or image</p>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Phone Number <span className="text-red-500">*</span>
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
            <p className="text-xs text-gray-500 mt-1">8 digits (e.g., 12345678)</p>
          </div>

          {/* Google Maps Link */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Google Maps Link <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.mapsLink}
              onChange={handleMapsLinkChange}
              placeholder="Paste your Google Maps location URL"
            />
            <p className="text-xs text-gray-500 mt-1">
              Copy the link from Google Maps and paste it here
            </p>
          </div>

          {/* Detected Location */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Detected Location
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-gray-50 text-gray-600"
              placeholder="Will be auto-filled from Google Maps link"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              This location will be extracted automatically
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving || uploadingImage}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || uploadingImage}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ProviderProfile() {
  const router = useRouter();
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

      toast.success("Profile updated successfully!");
      // Refetch to get updated data
      await refetch();
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      console.error("Error response:", err?.response?.data);
      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update profile";
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
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-8 md:p-12 flex flex-col items-center text-center">
        {/* Profile Image */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#E5F3E9] mb-6 shadow-md">
          <Image
            src={profileImageSrc}
            alt="Store Logo"
            width={160}
            height={160}
            className="object-cover w-full h-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
        </div>

        {/* Store Details */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-2">
          {loading ? "Loading..." : profile?.username || "Your Store"}
        </h1>
        <p className="text-lg text-gray-600 mb-1">
          {loading ? "..." : profile?.location || "Location"}
        </p>
        <p className="text-base text-gray-500 mb-8">
          {loading ? "..." : profile?.phoneNumber || "Phone number"}
        </p>

        {/* Stats Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {/* Number of Offers */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
            <div className="text-4xl font-bold text-emerald-700 mb-2">
              {loading ? "..." : stats.totalOffers}
            </div>
            <div className="text-sm font-medium text-emerald-600">
              Offers Published
            </div>
          </div>

          {/* Number of Items */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="text-4xl font-bold text-blue-700 mb-2">
              {loading ? "..." : stats.totalItems}
            </div>
            <div className="text-sm font-medium text-blue-600">
              Total Items
            </div>
          </div>

          {/* Generated Revenue */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200">
            <div className="text-4xl font-bold text-yellow-700 mb-2">
              {loading ? "..." : stats.revenue.toFixed(2)}
            </div>
            <div className="text-sm font-medium text-yellow-600">
              Revenue (TND)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
          <Link href="/provider/publish" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 px-6 py-3 rounded-full font-semibold shadow hover:shadow-md transition hover:-translate-y-0.5">
              Create New Offer
            </Button>
          </Link>
          <Button
            onClick={() => setIsEditModalOpen(true)}
            variant="outline"
            className="flex-1 px-6 py-3 rounded-full font-semibold border-2"
          >
            Edit Profile
          </Button>
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
