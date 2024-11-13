"use client";
import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import Image from "next/image";
import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DropzoneOptions } from "react-dropzone";

const AddOffer = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [files, setFiles] = useState<File[] | null>([]);
  const [offers, setOffers] = useState<{ price: number; title: string }[]>([]);

  const handleImage = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      return;
    }
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleImageUpload = async (newFiles: File[] | null) => {
    if (newFiles) {
      setFiles(newFiles);
      await handleImage(newFiles);
    }
  };

  const dropzone: DropzoneOptions = {
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    multiple: true,
    maxFiles: 4,
    maxSize: 1 * 1024 * 1024, 
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const priceToFloat = parseFloat(price);
    const quantityToFloat = parseFloat(quantity);

    if (isNaN(priceToFloat)) {
      toast.error("Invalid price value!");
      return;
    }

    const data = {
      title,
      description,
      price: priceToFloat,
      quantity: quantityToFloat,
      expirationDate: new Date(expirationDate).toISOString(),
      images: JSON.stringify(files), 
    };

    // plus à inclure manuellement les en-têtes dans chaque requête. Toutes les requêtes envoyées via axiosInstance auront automatiquement le token
    // const axiosInstance = axios.create({
    //   baseURL: process.env.NEXT_PUBLIC_BACKEND_URL + '',
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    // });

    // // Intercepteur pour ajouter l'Authorization automatiquement
    // axiosInstance.interceptors.request.use(
    //   (config) => {
    //     const token = localStorage.getItem('accessToken');
    //     if (token) {
    //       config.headers.Authorization = `Bearer ${token}`;
    //     }
    //     return config;
    //   },
    //   (error) => {
    //     return Promise.reject(error);
    //   }
    // );

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(process.env.NEXT_PUBLIC_BACKEND_URL + '/offers', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Offer submitted successfully!");
      setOffers([...offers, { price: priceToFloat, title }]);

    } catch (error) {
      console.error("Error submitting offer:", error);
      toast.error("Error submitting offer!");
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow-lg rounded-lg border border-gray-200">
      <ToastContainer />
  
      <h1 className="text-3xl font-bold text-green-800 mb-6 text-center">
        Publish your offer now!
      </h1>
  
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border-2 border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter title"
          />
        </div>
  
        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border-2 border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter description"
          />
        </div>
  
        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
            Price in dinars
          </label>
          <Input
            id="price"
            value={price}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d*$/.test(value)) {
                setPrice(value);
              }
            }}
            className="mt-1 block w-full border-2 border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter price"
          />
        </div>
  
        {/* Quantity */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <Input
            id="quantity"
            value={quantity}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d*$/.test(value)) {
                setQuantity(value);
              }
            }}
            className="mt-1 block w-full border-2 border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-green-500"
            placeholder="Enter quantity"
          />
        </div>
  
        {/* Expiration Date */}
        <div>
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-2">
            Expiration Date
          </label>
          <Input
            id="expirationDate"
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="mt-1 block w-full border-2 border-gray-300 rounded-md px-4 py-3 text-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
  
        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
          <FileUploader value={files} onValueChange={handleImageUpload} dropzoneOptions={dropzone}>
            <FileInput>
              <div className="flex items-center justify-center h-32 w-full border-2 border-dashed border-gray-300 bg-gray-50 rounded-md transition hover:bg-green-100">
                <p className="text-gray-500">Drop files here or click to upload</p>
              </div>
            </FileInput>
            <FileUploaderContent className="flex items-center gap-3 mt-3 flex-wrap">
              {files?.map((file, i) => (
                <FileUploaderItem
                  key={i}
                  index={i}
                  className="rounded-md shadow-md overflow-hidden"
                  aria-roledescription={`File ${i + 1} containing ${file.name}`}
                >
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    height={80}
                    width={80}
                    className="object-cover rounded-md"
                  />
                </FileUploaderItem>
              ))}
            </FileUploaderContent>
          </FileUploader>
        </div>
  
        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-white rounded-full border border-black px-4 py-3 text-lg bg-green-800 hover:bg-green-700 transition duration-200"
        >
          Post Offer
        </Button>

      </form>
    </div>
  );
  
};

export default AddOffer;
