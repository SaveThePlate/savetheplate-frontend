import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/DropFile";
import Image from "next/image";
import { useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";


export function AddOffer() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [files, setFiles] = useState<File[] | null>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const router = useRouter();

  const handleImage = async (files: File[] | null) => {
    if (!files || files.length === 0) {
      return;
    }
    
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
  
      const response = await axios.post('http://localhost:3001/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
        

    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  const handleImageUpload = async (newFiles: File[] | null) => {
    if (newFiles) {
      setFiles(newFiles);
      await handleImage(newFiles);
    }
  };
  const dropzone = {
    accept: {
      "image/*": [".jpg", ".jpeg", ".png"],
    },
    multiple: true,
    maxFiles: 4,
    maxSize: 1 * 1024 * 1024,
  } satisfies DropzoneOptions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      title,
      description,
      expirationDate: new Date(expirationDate).toISOString(),
      pickupLocation,
      images: JSON.stringify(files),
    };

    try {
      const response = await axios.post("http://localhost:3001/offers", data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Offer submitted successfully:", response.data);
      setSuccessMessage("Offer submitted successfully!");

      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (error) {
      console.error("Error submitting offer:", error);
    }
  };

  return (
    <div>
      {successMessage && <p className="text-green-600">{successMessage}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
       
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title</label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full" placeholder="Enter title" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1 block w-full" placeholder="Enter description" />
        </div>

        <div>
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date</label>
          <Input id="expirationDate" type="datetime-local" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
        </div>

        <div>
          <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">Pickup Location</label>
          <Input id="pickupLocation" value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="mt-1 block w-full" placeholder="Enter pickup location" />
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
                <FileUploaderItem key={i} index={i} className="size-20 p-0 rounded-md overflow-hidden" aria-roledescription={`file ${i + 1} containing ${file.name}`}>
                  <Image src={URL.createObjectURL(file)} alt={file.name} height={80} width={80} className="size-20 p-0" />

                </FileUploaderItem>
              ))}
            </FileUploaderContent>
          </FileUploader>
        </div>

        <Button type="submit" className="w-full">Post Offer</Button>

      </form>
    </div>
  );
}
