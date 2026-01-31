"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "react-toastify";
import { axiosInstance } from "@/lib/axiosInstance";
import { 
  X, 
  Upload, 
  Camera, 
  MapPin, 
  Phone, 
  User, 
  Save,
  Loader2,
  CheckCircle
} from "lucide-react";
import { useBlobUrl } from "@/hooks/useBlobUrl";
import { getBackendOrigin } from "@/lib/backendOrigin";
import { compressImage, shouldCompress } from "@/utils/imageCompression";

interface ImprovedEditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onSave: (updatedProfile: any) => Promise<void>;
}

export const ImprovedEditProfileModal: React.FC<ImprovedEditProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  profile, 
  onSave 
}) => {
  const { t } = useLanguage();
  const { createBlobUrl, revokeBlobUrl } = useBlobUrl();
  const profileBlobUrlRef = useRef<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    mapsLink: "",
    location: "",
  });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && profile) {
      setFormData({
        username: profile.username || "",
        phoneNumber: profile.phoneNumber || "",
        mapsLink: profile.mapsLink || "",
        location: profile.location || "",
      });
      setProfileImage(null);
      setLocalFile(null);
      setImagePreview("");
      
      // Set current profile image preview
      if (profile.profileImage) {
        const backendUrl = getBackendOrigin();
        let imageSrc = "";
        
        if (typeof profile.profileImage === "string") {
          if (profile.profileImage.startsWith("http")) {
            imageSrc = profile.profileImage;
          } else if (profile.profileImage.startsWith("/store/") || profile.profileImage.startsWith("/storage/")) {
            imageSrc = `${backendUrl}${profile.profileImage}`;
          } else {
            // Bare filename
            imageSrc = `${backendUrl}/store/${profile.profileImage}`;
          }
        } else if (profile.profileImage?.url) {
          imageSrc = profile.profileImage.url;
        }
        
        setImagePreview(imageSrc);
      }
    }
  }, [isOpen, profile]);

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (profileBlobUrlRef.current) {
        revokeBlobUrl(profileBlobUrlRef.current);
        profileBlobUrlRef.current = null;
      }
    };
  }, [revokeBlobUrl]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      setLocalFile(null);
      setProfileImage(null);
      setImagePreview("");
      return;
    }

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t("profile_completion.missing_image") || "Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    setLocalFile(file);
    setUploadingImage(true);

    try {
      // Compress image if needed
      let processedFile = file;
      if (shouldCompress(file, 1)) {
        processedFile = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          maxSizeMB: 2,
        });
      }

      // Create preview
      const blobUrl = createBlobUrl(processedFile);
      if (profileBlobUrlRef.current) {
        revokeBlobUrl(profileBlobUrlRef.current);
      }
      profileBlobUrlRef.current = blobUrl;
      setImagePreview(blobUrl || "");

      // Upload to server
      const formData = new FormData();
      formData.append("files", processedFile);

      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token");

      const response = await axiosInstance.post("/storage/upload", formData, {
        headers: { 
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        },
        timeout: 30000,
      });

      const uploaded = Array.isArray(response.data) ? response.data : [response.data];
      const imageFile = uploaded[0];
      
      if (imageFile?.filename) {
        setProfileImage(imageFile.filename);
        toast.success("Image uploaded successfully");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setLocalFile(null);
      setImagePreview("");
      
      // Restore original image if upload failed
      if (profile?.profileImage) {
        const backendUrl = getBackendOrigin();
        let imageSrc = "";
        
        if (typeof profile.profileImage === "string") {
          if (profile.profileImage.startsWith("http")) {
            imageSrc = profile.profileImage;
          } else if (profile.profileImage.startsWith("/store/") || profile.profileImage.startsWith("/storage/")) {
            imageSrc = `${backendUrl}${profile.profileImage}`;
          } else {
            imageSrc = `${backendUrl}/store/${profile.profileImage}`;
          }
        }
        setImagePreview(imageSrc);
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      toast.error("Store name is required");
      return;
    }

    if (!formData.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!formData.mapsLink.trim()) {
      toast.error("Google Maps link is required");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        username: formData.username.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        mapsLink: formData.mapsLink.trim(),
        location: formData.location.trim(),
        profileImage: profileImage,
      });
      
      toast.success("Profile updated successfully");
      onClose();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {t("provider.profile.edit_dialog.title") || "Edit Profile"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Update your store information
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Profile Image */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gray-100 overflow-hidden border-4 border-white shadow-lg">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Upload Status */}
              {uploadingImage && (
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              
              {profileImage && !uploadingImage && (
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            <label className="mt-4 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
                disabled={uploadingImage}
              />
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {uploadingImage ? "Uploading..." : "Change Photo"}
                </span>
              </div>
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Store Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4" />
                Store Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="Enter your store name"
                className="w-full"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4" />
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="12345678"
                maxLength={8}
                type="tel"
                className="w-full"
              />
            </div>

            {/* Google Maps Link */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                Google Maps Link <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.mapsLink}
                onChange={(e) => handleInputChange('mapsLink', e.target.value)}
                placeholder="Paste your Google Maps link here"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your location link from Google Maps and paste it here
              </p>
            </div>

            {/* Location Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                Location Name
              </label>
              <Input
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Tunis, Tunisia"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                This will be auto-extracted from your Maps link
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving || uploadingImage}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || uploadingImage}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
