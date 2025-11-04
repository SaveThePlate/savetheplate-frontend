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

const AddOffer: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [localFiles, setLocalFiles] = useState<File[] | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [offers, setOffers] = useState<{ price: number; title: string }[]>([]);

  // ✅ Axios instance
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

    const priceToFloat = parseFloat(price);
    const quantityToFloat = parseFloat(quantity);

    if (isNaN(priceToFloat)) {
      toast.error("Invalid price value!");
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
        title,
        description,
        price: priceToFloat,
        quantity: quantityToFloat,
        expirationDate: new Date(expirationDate).toISOString(),
        images: JSON.stringify(imagesPayload),
      };

      await axiosInstance.post("/offers", payload);
      toast.success("Offer submitted successfully!");

      setOffers([...offers, { price: priceToFloat, title }]);
      setTitle("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setExpirationDate("");
      setLocalFiles(null);
      setUploadedImages([]);
    } catch (error) {
      console.error("Error submitting offer:", error);
      toast.error("Error submitting offer!");
    }
  };

  // ✅ Return JSX
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-md">
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

      <h1 className="text-xl font-semibold text-700">Publish your offer now!</h1>
      <br />
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
          />
        </div>

        {/* Price */}
        <div>
          <label
            htmlFor="price"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Price in dinars
          </label>
          <Input
            id="price"
            value={price}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d*$/.test(value)) setPrice(value);
            }}
            placeholder="Enter price"
          />
        </div>

        {/* Quantity */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Quantity
          </label>
          <Input
            id="quantity"
            value={quantity}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d*$/.test(value)) setQuantity(value);
            }}
            placeholder="Enter quantity"
          />
        </div>

        {/* Expiration Date */}
        <div>
          <label
            htmlFor="expirationDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Expiration Date
          </label>
          <Input
            id="expirationDate"
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images
          </label>
          <FileUploader
            value={localFiles || []}
            onValueChange={handleImageUpload}
            dropzoneOptions={dropzone}
          >
            <FileInput>
              <div className="flex items-center justify-center h-32 w-full border border-dashed border-gray-300 bg-gray-50 rounded-md">
                <p className="text-gray-400">Drop files here or click to upload</p>
              </div>
            </FileInput>

            <FileUploaderContent className="flex items-center flex-row gap-2 mt-2">
              {localFiles?.map((file, i) => (
                <FileUploaderItem
                  key={i}
                  index={i}
                  className="size-20 p-0 rounded-md overflow-hidden"
                  aria-roledescription={`File ${i + 1} containing ${file.name}`}
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    height={80}
                    width={80}
                    className="size-20 object-cover rounded-md"
                  />
                </FileUploaderItem>
              ))}
            </FileUploaderContent>
          </FileUploader>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full bg-green-600 text-white hover:bg-green-700 transition duration-200"
        >
          Post Offer
        </Button>
      </form>
    </div>
  );
};

export default AddOffer;