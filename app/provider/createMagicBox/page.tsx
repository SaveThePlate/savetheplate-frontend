"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type MagicBoxSize = "small" | "medium" | "big";

interface MagicBoxOption {
  price: number;
  description: string;
}

const DEFAULT_IMAGE = "/logo.png";

const CreateMagicBoxPage = () => {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<MagicBoxSize>("small");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [defaultImage, setDefaultImage] = useState<string>(DEFAULT_IMAGE); 
  const [quantity, setQuantity] = useState("");

  const magicBoxOptions: Record<MagicBoxSize, MagicBoxOption> = {
    small: { price: 3, description: "A small box with a selection of items." },
    medium: { price: 7, description: "A medium box with more items." },
    big: { price: 10, description: "A big box with a wide variety of items." },
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
    }
  }, [router]);

  const handleCreateMagicBox = async () => {
    setLoading(true);
    setDefaultImage(defaultImage || DEFAULT_IMAGE); 
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("You need to be logged in to create a magic box.");
      setLoading(false);
      return;
    }

    const quantityToFloat = parseFloat(quantity);

    try {
      const response = await axios.post(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/offers", 
        {
          title: `${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} Magic Box`,
          description: magicBoxOptions[selectedSize].description,
          price: magicBoxOptions[selectedSize].price,
          expirationDate: new Date(expirationDate).toISOString(),
          pickupLocation: "Default Location",
          latitude: 0,
          longitude: 0,
          images: JSON.stringify([DEFAULT_IMAGE]),
          quantity: quantityToFloat,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("Magic box created:", response.data);
      toast.success("Offer submitted successfully!");
    } catch (error) {
      console.error("Error creating magic box:", error);
      toast.error("Error submitting offer!");
      setError("Failed to create magic box.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 via-green-300 to-green-200 p-6">
    
    <ToastContainer /> 
      <main className="bg-white shadow-lg rounded-lg p-8 w-full max-w-2xl space-y-6">
        <button onClick={() => router.back()} className="text-gray-500 mb-4">
          &lt; Back
        </button>
        <h1 className="text-3xl font-bold mb-4 text-center text-green-900">Create Magic Box</h1>
        
        <div className="space-y-4">
          {Object.entries(magicBoxOptions).map(([size, { price, description }]) => (
            <div key={size} className="border p-4 rounded-lg">
              <h2 className="text-lg font-semibold">{size.charAt(0).toUpperCase() + size.slice(1)} Magic Box</h2>
              <p>{description}</p>
              <p className="text-lg font-bold">Price: {price} dt</p>
              <button
                onClick={() => setSelectedSize(size as MagicBoxSize)}
                className={`py-2 px-4 rounded ${selectedSize === size ? "bg-blue-600 text-white" : "bg-gray-200"}`}
              >
                Select
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
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

        <div className="space-y-2">
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date</label>
          <Input
            id="expirationDate"
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>

        <button
          onClick={handleCreateMagicBox}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Magic Box"}
        </button>

        {error && <p className="text-red-500 mt-2">{error}</p>}
       
      </main>
    </div>
  );
};

export default CreateMagicBoxPage;
