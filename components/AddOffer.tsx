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

type UploadedImage = {
  filename: string;
  url: string;
  absoluteUrl: string;
  blurhash?: string;
  width?: number;
  height?: number;
};

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

const AddOffer: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [localFiles, setLocalFiles] = useState<File[] | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
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
    if (!localFiles) setUploadedImages([]);
  }, [localFiles]);

  // ✅ Upload files
  async function uploadFiles(files: File[]): Promise<UploadedImage[]> {
    if (!files || files.length === 0) return [];

    const fd = new FormData();
    files.forEach((f) => fd.append("files", f));

    try {
      const res = await axiosInstance.post("/storage/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = res.data as any[];
      const mapped: UploadedImage[] = data.map((item) => ({
        filename: item.filename,
        url: item.url || `/storage/${item.filename}`,
        absoluteUrl:
          item.absoluteUrl ||
          (item.url
            ? `${axiosInstance.defaults.baseURL}${item.url}`
            : `/storage/${item.filename}`),
        blurhash: item.blurhash,
        width: item.width,
        height: item.height,
      }));
      return mapped;
    } catch (err: any) {
      console.error("Upload error", err?.response?.data || err.message || err);
      throw err;
    }
  }

  // ✅ Handle image upload
  const handleImage = async (files: File[] | null) => {
    if (!files || files.length === 0) return;
    try {
      const uploaded = await uploadFiles(files);
      setUploadedImages(uploaded);
      setLocalFiles(files);
      toast.success(`${uploaded.length} image(s) uploaded.`);
    } catch (error) {
      toast.error("Error uploading files");
    }
  };

  const handleImageUpload = async (newFiles: File[] | null) => {
    if (!newFiles || newFiles.length === 0) {
      setLocalFiles(null);
      return;
    }
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
      toast.error("Please enter a title");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    const priceToFloat = parseFloat(price);
    if (isNaN(priceToFloat) || priceToFloat <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const quantityToFloat = parseFloat(quantity);
    if (isNaN(quantityToFloat) || quantityToFloat <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (!expirationDate) {
      toast.error("Please select an expiration date");
      return;
    }

    const expirationDateObj = new Date(expirationDate);
    if (expirationDateObj <= new Date()) {
      toast.error("Expiration date must be in the future");
      return;
    }

    if (!pickupLocation.trim()) {
      toast.error("Please enter a pickup location");
      return;
    }

    try {
      // Upload pending files if needed
      if (localFiles && localFiles.length > 0 && uploadedImages.length === 0) {
        const uploaded = await uploadFiles(localFiles);
        setUploadedImages(uploaded);
      }

      const imagesPayload = uploadedImages.map((img) => ({
        filename: img.filename,
        url: img.url,
        absoluteUrl: img.absoluteUrl,
      }));

      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: priceToFloat,
        quantity: quantityToFloat,
        expirationDate: expirationDateObj.toISOString(),
        pickupLocation: pickupLocation.trim(),
        images: JSON.stringify(imagesPayload),
      };

      await axiosInstance.post("/offers", payload);
      toast.success("Offer created successfully! 🎉");

      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setExpirationDate("");
      setPickupLocation("");
      setLocalFiles(null);
      setUploadedImages([]);
      
      // Redirect to home after short delay
      setTimeout(() => {
        window.location.href = "/provider/home";
      }, 1500);
    } catch (error: any) {
      console.error("Error submitting offer:", error);
      const errorMessage = error?.response?.data?.message || "Failed to create offer";
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
            Offer Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Fresh Pastries Bundle"
            className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
            required
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">A clear, descriptive title helps customers find your offer</p>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what's included in this offer. Be specific about items, quantities, and any special details..."
            className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl min-h-[120px] resize-none"
            required
            minLength={10}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/500 characters. Minimum 10 characters required.
          </p>
        </div>

        {/* Price and Quantity Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Price (TND) <span className="text-red-500">*</span>
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
                placeholder="0.00"
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 pr-12"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">dt</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Set a fair price for your offer</p>
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Available Quantity <span className="text-red-500">*</span>
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
              placeholder="1"
              className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
              required
            />
            <p className="text-xs text-gray-500 mt-1">How many units are available?</p>
          </div>
        </div>

        {/* Pickup Location */}
        <div>
          <label
            htmlFor="pickupLocation"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Pickup Location <span className="text-red-500">*</span>
          </label>
          <Input
            id="pickupLocation"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            placeholder="e.g., 123 Main Street, Tunis"
            className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Where should customers pick up their order?</p>
        </div>

        {/* Expiration Date */}
        <div>
          <label
            htmlFor="expirationDate"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Pickup Deadline <span className="text-red-500">*</span>
          </label>
          <Input
            id="expirationDate"
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3"
            required
          />
          <p className="text-xs text-gray-500 mt-1">When should customers pick up by?</p>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Photos <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <FileUploader
            value={localFiles || []}
            onValueChange={handleImageUpload}
            dropzoneOptions={dropzone}
          >
            <FileInput>
              <div className="flex flex-col items-center justify-center h-40 w-full border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-gray-600 font-medium">Click or drag to upload photos</p>
                <p className="text-xs text-gray-400 mt-1">Up to 5 images, max 5MB each</p>
              </div>
            </FileInput>

            <FileUploaderContent className="flex items-center flex-row gap-3 mt-3 flex-wrap">
              {localFiles?.map((file, i) => (
                <FileUploaderItem
                  key={i}
                  index={i}
                  className="size-24 p-0 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm"
                  aria-roledescription={`File ${i + 1} containing ${file.name}`}
                >
                  <Image
                    src={URL.createObjectURL(file) || DEFAULT_BAG_IMAGE}
                    alt={file.name}
                    height={96}
                    width={96}
                    className="size-24 object-cover rounded-xl"
                  />
                </FileUploaderItem>
              ))}
            </FileUploaderContent>
          </FileUploader>
          <p className="text-xs text-gray-500 mt-2">Good photos help attract more customers!</p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={!title.trim() || !description.trim() || !price || !quantity || !expirationDate || !pickupLocation.trim()}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.01] mt-2"
        >
          Create Offer
        </Button>
      </form>
    </div>
  );
};

export default AddOffer;