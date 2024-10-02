import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import Image from "next/image";
import { useState} from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { DropzoneOptions } from "react-dropzone";

export function AddOffer() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [files, setFiles] = useState<File[] | null>([]);
  const [offers, setOffers] = useState<{ lat: number; lng: number; title: string }[]>([]);

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      toast.error("Invalid latitude or longitude values!");
      return;
    }

    const data = {
      title,
      description,
      expirationDate: new Date(expirationDate).toISOString(),
      pickupLocation: "", 
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
      setOffers([...offers, { lat: latitude, lng: longitude, title }]);
    
    } catch (error) {
      console.error("Error submitting offer:", error);
      toast.error("Error submitting offer!");
    }
  };


  return (
    <div>

      <ToastContainer />

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Title
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full"
            placeholder="Enter title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full"
            placeholder="Enter description"
          />
        </div>

        <div>
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">
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
          <label htmlFor="lat" className="block text-sm font-medium text-gray-700">
            Latitude
          </label>
          <Input
            id="lat"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className="mt-1 block w-full"
            placeholder="Enter latitude"
          />
        </div>

        <div>
          <label htmlFor="lng" className="block text-sm font-medium text-gray-700">
            Longitude
          </label>
          <Input
            id="lng"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="mt-1 block w-full"
            placeholder="Enter longitude"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Images</label>
          <FileUploader value={files} onValueChange={handleImageUpload} dropzoneOptions={dropzone}>
            <FileInput>
              <div className="flex items-center justify-center h-32 w-full border bg-background rounded-md">
                <p className="text-gray-400">Drop files here</p>
              </div>
            </FileInput>
            <FileUploaderContent className="flex items-center flex-row gap-2">
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

        <Button type="submit" className="w-full">
          Post Offer
        </Button>
      </form>

    </div>
  );
}
