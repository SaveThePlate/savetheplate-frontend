"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift } from "lucide-react";

type MagicBoxSize = "small" | "medium" | "big";

interface MagicBoxOption {
  price: number;
  description: string;
  images?: string;
}

const DEFAULT_IMAGE = "/logo.png";
const largeSurpriseBag = "/largesurprisebag.png";
const mediumSurpriseBag = "/mediumsurprisebag.png";
const smallSurpriseBag = "/smallsurprisebag.png";

const CreateMagicBoxPage = () => {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<MagicBoxSize>("small");
  const [expirationDate, setExpirationDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [quantity, setQuantity] = useState("");

  const magicBoxOptions: Record<MagicBoxSize, MagicBoxOption> = {
    small: { price: 5, description: "A small box with a selection of items.", images: smallSurpriseBag },
    medium: { price: 7, description: "A medium box with more items.", images: mediumSurpriseBag },
    big: { price: 10, description: "A big box with a wide variety of items.", images: largeSurpriseBag },
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/signIn");
  }, [router]);

  const handleCreateMagicBox = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const quantityToFloat = parseFloat(quantity);

    try {
      // Build the images payload with an absoluteUrl pointing to frontend-hosted asset
      const imagePath = magicBoxOptions[selectedSize].images || DEFAULT_IMAGE;
      // Prefer NEXT_PUBLIC_FRONTEND_URL (set in .env.local), otherwise use window.location.origin
      const frontendOrigin =
        (process.env.NEXT_PUBLIC_FRONTEND_URL as string) ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const absoluteUrl =
        frontendOrigin.replace(/\/$/, "") +
        (imagePath.startsWith("/") ? imagePath : `/${imagePath}`);

      const imagesPayload = JSON.stringify([
        {
          // asset is frontend-hosted, so keep filename null (not uploaded to backend store)
          filename: null,
          // url keeps the local filename without leading slash to preserve backwards compatibility
          url: imagePath.replace(/^\//, ""),
          absoluteUrl,
          alt: `${selectedSize} magic box image`,
        },
      ]);

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
          // images: imagesPayload,
          images: JSON.stringify([
              {
                filename: (magicBoxOptions[selectedSize].images || DEFAULT_IMAGE).replace(/^\//, ""),
                alt: `${selectedSize} magic box image`,
              },
            ]),
          quantity: quantityToFloat,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Magic Box created successfully!");
      // optionally redirect after creation
      // router.push('/offers') or similar
    } catch (error) {
      console.error(error);
      toast.error("Error submitting offer!");
      setError("Failed to create magic box.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F9FAF5] min-h-screen pt-24 pb-20 flex flex-col items-center">
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

      <main className="relative w-full max-w-xl bg-white rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 sm:p-10 transition-all duration-300 hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)]">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="absolute top-5 left-5 flex items-center text-gray-500 hover:text-green-700 gap-2 text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Back</span>
        </Button>

        {/* Header */}
        <div className="flex flex-col items-center mb-10 mt-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[#EAF7ED] flex items-center justify-center mb-5">
            <Gift className="w-10 h-10 text-green-800" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-green-900 leading-tight">
            Create Magic Box
          </h1>
          <p className="text-gray-600 text-base mt-2 max-w-sm">
            Surprise your customers and help reduce waste 💚
          </p>
        </div>

        {/* Magic Box Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {Object.entries(magicBoxOptions).map(([size, { price, description }]) => (
            <div
              key={size}
              onClick={() => setSelectedSize(size as MagicBoxSize)}
              className={`cursor-pointer rounded-2xl p-5 text-center transition-all duration-200 shadow-sm hover:shadow-md border ${
                selectedSize === size
                  ? "bg-[#EAF7ED] border-green-600 scale-[1.03]"
                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <h2 className="text-lg font-semibold text-green-900 capitalize">
                {size}
              </h2>
              <p className="text-gray-600 text-sm mt-1 mb-2 leading-snug">
                {description}
              </p>
              <p className="font-bold text-green-800">{price} dt</p>
            </div>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
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
              className="border-gray-300 focus:ring-green-500 focus:border-green-500 rounded-xl py-2.5"
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
              className="border-gray-300 focus:ring-green-500 focus:border-green-500 rounded-xl py-2.5"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleCreateMagicBox}
          disabled={loading}
          className="mt-10 w-full bg-[#FFD84D] text-[#243B28] font-bold py-3.5 rounded-full shadow-md transition-transform hover:scale-[1.03] hover:bg-[#FFE169]"
        >
          {loading ? "Creating..." : "Create Magic Box"}
        </Button>

        {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Every box you create makes a difference 🌍
        </p>
      </main>
    </div>
  );
};

export default CreateMagicBoxPage;