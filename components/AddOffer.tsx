import {
  FileInput,
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/dropFile";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DropzoneOptions } from "react-dropzone";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export function AddOffer() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  // const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const [files, setFiles] = useState<File[] | null>([]);
  
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


  // const loadGoogleMapsScript = (callback: () => void) => {
  //   if (typeof window !== "undefined" && !window.google) {
  //     const script = document.createElement("script");
  //     script.src = `https://maps.googleapis.com/maps/api/js?key=NEXT_PUBLIC_MAPS_API_KEY&libraries=places`;
  //     script.async = true;
  //     script.onload = callback;
  //     document.head.appendChild(script);
  //   } else {
  //     callback();
  //   }
  // };

  // const initializeAutocomplete = () => {
  //   if (window.google && inputRef.current) {
  //     autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
  //       types: ["establishment"],
  //       componentRestrictions: { country: "TN" },
  //     });

  //     autocompleteRef.current.addListener("place_changed", () => {
  //       const place = autocompleteRef.current.getPlace();
  //       if (place && place.formatted_address) {
  //         setPickupLocation(place.formatted_address);
  //         const location = place.geometry?.location;
  //         if (location) {
  //           setCoordinates({ lat: location.lat(), lng: location.lng() });
  //         }
  //       }
  //     });
  //   }
  // };

  // useEffect(() => {
  //   loadGoogleMapsScript(initializeAutocomplete);
  // }, []);

  // 
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const coordinates = { lat: parseFloat(lat.toString()), lng: parseFloat(lng.toString()) };

    const data = {
      title,
      description,
      expirationDate: new Date(expirationDate).toISOString(),
      pickupLocation,
      latitude: coordinates.lat, 
      longitude: coordinates.lng,
      images: JSON.stringify(files),
    };

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post("http://localhost:3001/offers", data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // console.log("Offer submitted successfully:", response.data);
      
      toast.success("Offer submitted successfully!");
      
    } catch (error) {
      console.error("Error submitting offer:", error);
    }
  };

  const handleImage = async (files: File[] | null) => {
    if (!files || files.length === 0) return;
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      await axios.post("http://localhost:3001/storage/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
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

  return (
    <div >
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
          <label htmlFor="pickupLocation" className="block text-sm font-medium text-gray-700">
            Pickup Location
          </label>
          <Input
            id="pickupLocation"
            ref={inputRef}
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="mt-1 block w-full"
            placeholder="Enter pickup location"
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
                  aria-roledescription={`file ${i + 1} containing ${file.name}`}
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

      {/* Pass coordinates to Map */}
      <Map coordinates={{ lat: parseFloat(lat.toString()), lng: parseFloat(lng.toString()) }} />
    </div>
  );
}
