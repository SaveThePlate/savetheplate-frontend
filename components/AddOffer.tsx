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
  const [expirationDate, setExpirationDate] = useState("");
  const [googleMapsLink, setGoogleMapsLink] = useState("");
  const [files, setFiles] = useState<File[] | null>([]);
  const [offers, setOffers] = useState<{ lat: number; lng: number; price: number; title: string }[]>([]);

  const handleImage = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      return;
    }
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      await axios.post("http://localhost:3001/storage/upload", formData, {
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

  const extractLocationData = (googleMapsUrl: string) => {
    const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match = googleMapsUrl.match(regex);

    if (!match) {
      return { latitude: null, longitude: null, locationName: null };
    }

    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);

    // Extract the location name if available in the URL
    const nameRegex = /maps\/place\/([^/@]+)/;
    const nameMatch = googleMapsUrl.match(nameRegex);
    let locationName = "";
    
    if (nameMatch) {
      locationName = decodeURIComponent(nameMatch[1]).replace(/\+/g, " ");
    }

    return { latitude, longitude, locationName };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { latitude, longitude, locationName } = extractLocationData(googleMapsLink);

    if (!latitude || !longitude || !locationName) {
      toast.error("Invalid Google Maps link!");
      return;
    }

    const priceToFloat = parseFloat(price);

    if (isNaN(priceToFloat)) {
      toast.error("Invalid price value!");
      return;
    }

    const data = {
      title,
      description,
      price: priceToFloat,
      expirationDate: new Date(expirationDate).toISOString(),
      pickupLocation: locationName, // Set the scraped location name as the pickup location
      latitude,
      longitude,
      images: JSON.stringify(files), 
    };

    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('http://localhost:3001/offers', data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Offer submitted successfully!");
      setOffers([...offers, { lat: latitude, lng: longitude, price: priceToFloat, title }]);

    } catch (error) {
      console.error("Error submitting offer:", error);
      toast.error("Error submitting offer!");
    }
  };

  const handleLinkChange = (e: any) => {
    setGoogleMapsLink(e.target.value);
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
          <label htmlFor="googleMapsLink" className="block text-sm font-medium text-gray-700 mb-1">
            Google Maps Link
          </label>
          <Input
            id="googleMapsLink"
            value={googleMapsLink}
            onChange={handleLinkChange}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter Google Maps link"
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
