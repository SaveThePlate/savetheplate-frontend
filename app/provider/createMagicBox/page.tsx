"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Button } from "@/components/ui/button";

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
  const [quantity, setQuantity] = useState("");

  const magicBoxOptions: Record<MagicBoxSize, MagicBoxOption> = {
    small: { price: 5, description: "A small box with a selection of items." },
    medium: { price: 7, description: "A medium box with more items." },
    big: { price: 10, description: "A big box with a wide variety of items." },
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/signIn");
  }, [router]);

  const handleCreateMagicBox = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("You need to be logged in to create a magic box.");
      setLoading(false);
      return;
    }

    const quantityToFloat = parseFloat(quantity);

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers`,
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

      toast.success("Magic box created successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error submitting offer!");
      setError("Failed to create magic box.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#cdeddf] to-[#e6f7f2] p-6">
      <ToastContainer />
      <main className="bg-white shadow-xl rounded-3xl p-8 w-full max-w-3xl space-y-6">
        <button onClick={() => router.back()} className="text-gray-500 font-medium mb-4">
          &lt; Back
        </button>

        <h1 className="text-3xl font-bold text-center text-green-900 mb-6">
          Create Magic Box
        </h1>

        {/* Magic Box Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(magicBoxOptions).map(([size, { price, description }]) => (
            <div
              key={size}
              onClick={() => setSelectedSize(size as MagicBoxSize)}
              className={`cursor-pointer border p-4 rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg ${
                selectedSize === size
                  ? "bg-green-100 border-green-500 scale-105"
                  : "bg-gray-100 border-gray-300"
              }`}
            >
              <h2 className="text-lg font-semibold mb-1">
                {size.charAt(0).toUpperCase() + size.slice(1)}
              </h2>
              <p className="text-sm mb-2">{description}</p>
              <p className="font-bold text-green-800">Price: {price} dt</p>
            </div>
          ))}
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
          <Input
            id="quantity"
            value={quantity}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*\.?\d*$/.test(value)) setQuantity(value);
            }}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Enter quantity"
          />
        </div>

        {/* Expiration Date Input */}
        <div className="space-y-2">
          <label htmlFor="expirationDate" className="block text-sm font-medium text-gray-700">Expiration Date</label>
          <Input
            id="expirationDate"
            type="datetime-local"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleCreateMagicBox}
          disabled={loading}
          className="w-full bg-yellow-300 text-black font-bold py-3 rounded-full shadow-md transition transform hover:scale-105 hover:bg-yellow-400"
        >
          {loading ? "Creating..." : "Create Magic Box"}
        </Button>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      </main>
    </div>
  );
};

export default CreateMagicBoxPage;
