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
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-md">
      <ToastContainer />

      <h1 className="text-xl font-semibold text-700">Publish your offer now!</h1>     
      <br/>      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter description"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter price"
          />
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
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
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter quantity"
          />
        </div>

        <div>
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700 mb-1">
            Expiration Date
          </label>
          <Input
            id="expirationDate"
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

       

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
          <FileUploader value={files} onValueChange={handleImageUpload} dropzoneOptions={dropzone}>
            <FileInput>
              <div className="flex items-center justify-center h-32 w-full border border-dashed border-gray-300 bg-gray-50 rounded-md">
                <p className="text-gray-400">Drop files here or click to upload</p>
              </div>
            </FileInput>
            <FileUploaderContent className="flex items-center flex-row gap-2 mt-2">
              {files?.map((file, i) => (
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
                    className="size-20 p-0"
                  />
                </FileUploaderItem>
              ))}
            </FileUploaderContent>
          </FileUploader>
        </div>

        <Button type="submit" className="w-full bg-green-600 text-white hover:bg-green-700 transition duration-200">
          Post Offer
        </Button>
      </form>
    </div>
  );
};

export default AddOffer;