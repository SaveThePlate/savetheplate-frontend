"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift } from "lucide-react";
import Image from "next/image";

type RescuePackSize = "small" | "medium" | "large";

interface RescuePackOption {
  price: number;
  description: string;
  images?: string;
  items: string;
}

const DEFAULT_IMAGE = "/defaultBag.png";
const largeSurpriseBag = "/largesurprisebag.png";
const mediumSurpriseBag = "/mediumsurprisebag.png";
const smallSurpriseBag = "/smallsurprisebag.png";

const CreateMagicBoxPage = () => {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<RescuePackSize>("small");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [pickupStartTime, setPickupStartTime] = useState<string>("");
  const [pickupEndTime, setPickupEndTime] = useState<string>("");
  // Pickup location is now taken from user's profile, no need for state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [quantity, setQuantity] = useState("");

  const [originalPrice, setOriginalPrice] = useState<Record<RescuePackSize, string>>({
    small: "",
    medium: "",
    large: "",
  });

  const rescuePackOptions: Record<RescuePackSize, RescuePackOption> = {
    small: { 
      price: 5, 
      description: "Perfect for individuals - a curated mix of rescued items", 
      images: smallSurpriseBag,
      items: "2-3 items"
    },
    medium: { 
      price: 7, 
      description: "Great for small families - more variety and value", 
      images: mediumSurpriseBag,
      items: "4-5 items"
    },
    large: { 
      price: 10, 
      description: "Ideal for larger groups - maximum variety and savings", 
      images: largeSurpriseBag,
      items: "6+ items"
    },
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) router.push("/signIn");
  }, [router]);

  const handleCreateRescuePack = async () => {
    // Validation
    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Please enter a valid quantity");
      toast.error("Quantity is required");
      return;
    }

    if (!pickupDate) {
      setError("Please select a pickup date");
      toast.error("Pickup date is required");
      return;
    }

    if (!pickupStartTime) {
      setError("Please select a start time");
      toast.error("Start time is required");
      return;
    }

    if (!pickupEndTime) {
      setError("Please select an end time");
      toast.error("End time is required");
      return;
    }

    // Pickup location will be taken from user's profile, no need to validate

    // Combine date and times
    const startDateTime = new Date(`${pickupDate}T${pickupStartTime}`);
    const endDateTime = new Date(`${pickupDate}T${pickupEndTime}`);

    if (startDateTime >= endDateTime) {
      setError("End time must be after start time");
      toast.error("End time must be after start time");
      return;
    }

    if (endDateTime <= new Date()) {
      setError("Pickup time must be in the future");
      toast.error("Please select a future time");
      return;
    }

    setLoading(true);
    setError("");
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const quantityToFloat = parseFloat(quantity);

    try {
      const imagePath = rescuePackOptions[selectedSize].images || DEFAULT_IMAGE;
      const imagesPayload = JSON.stringify([
        {
          url: imagePath.startsWith("/") ? imagePath : `/${imagePath}`,
        },
      ]);

      // Parse originalPrice - include it if it's a valid positive number
      let originalPriceValue: number | undefined = undefined;
      const originalPriceStr = originalPrice[selectedSize];
      if (originalPriceStr && originalPriceStr.trim() !== "") {
        const parsed = parseFloat(originalPriceStr.trim());
        if (!isNaN(parsed) && parsed > 0) {
          originalPriceValue = parsed;
        }
      }

      // Use end time as expiration date for backward compatibility
      const payload: any = {
        title: `${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} Rescue Pack`,
        description: `${rescuePackOptions[selectedSize].description}. Contains ${rescuePackOptions[selectedSize].items} of rescued food items.`,
        price: rescuePackOptions[selectedSize].price,
        expirationDate: endDateTime.toISOString(),
        pickupStartTime: startDateTime.toISOString(),
        pickupEndTime: endDateTime.toISOString(),
        // pickupLocation will be set from user's profile on the backend
        latitude: 0,
        longitude: 0,
        images: imagesPayload,
        quantity: quantityToFloat,
      };

      // Only include originalPrice if it has a value (don't send undefined)
      if (originalPriceValue !== undefined) {
        payload.originalPrice = originalPriceValue;
      }

      console.log("Sending payload:", payload); // Debug log

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/offers`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Rescue Pack created successfully! 🎉");
      setTimeout(() => {
        router.push("/provider/home");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.response?.data?.message || "Failed to create rescue pack";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-20 flex flex-col items-center">
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
        <div className="flex flex-col items-center mb-8 mt-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 shadow-sm">
            <Gift className="w-10 h-10 text-emerald-700" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            Create Rescue Pack
          </h1>
          <p className="text-gray-600 text-base mt-2 max-w-sm">
            Quick setup with preset sizes and prices. Perfect for mixed surplus items! 💚
          </p>
        </div>

        {/* Rescue Pack Size Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Object.entries(rescuePackOptions).map(([size, { price, description, images, items }]) => (
            <div
              key={size}
              onClick={() => setSelectedSize(size as RescuePackSize)}
              className={`cursor-pointer rounded-2xl p-5 text-center transition-all duration-200 shadow-sm hover:shadow-md border-2 ${
                selectedSize === size
                  ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-500 scale-[1.02] shadow-md"
                  : "bg-white border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center mb-3">
                <Image
                  src={images || DEFAULT_IMAGE}
                  alt={`${size} rescue pack`}
                  width={90}
                  height={90}
                  className="object-contain mx-auto"
                />
              </div>
              <h2 className="text-lg font-bold text-gray-900 capitalize mb-1">
                {size}
              </h2>
              <p className="text-xs text-emerald-700 font-medium mb-2">
                {items}
              </p>
              <p className="text-gray-600 text-sm mb-3 leading-snug min-h-[40px]">
                {description}
              </p>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="font-bold text-2xl text-emerald-700">{price} dt</p>
                {originalPrice[size as RescuePackSize] && parseFloat(originalPrice[size as RescuePackSize]) > price && (
                  <p className="text-xs text-gray-500 line-through mt-1">
                    {parseFloat(originalPrice[size as RescuePackSize]).toFixed(2)} dt
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-semibold text-gray-700 mb-2">
                Available Quantity <span className="text-red-500">*</span>
              </label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) setQuantity(value);
                }}
                placeholder="How many packs?"
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 text-base"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Number of {selectedSize} packs available</p>
            </div>

            <div>
              <label htmlFor="originalPrice" className="block text-sm font-semibold text-gray-700 mb-2">
                Original Price (TND) <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </label>
              <div className="relative">
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalPrice[selectedSize]}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*\.?\d*$/.test(value)) {
                      setOriginalPrice(prev => ({ ...prev, [selectedSize]: value }));
                    }
                  }}
                  placeholder="0.00"
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 pr-12 text-base"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">dt</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {originalPrice[selectedSize] && parseFloat(originalPrice[selectedSize]) > rescuePackOptions[selectedSize].price && (
                  <span className="text-emerald-600 font-semibold">
                    Save {((1 - rescuePackOptions[selectedSize].price / parseFloat(originalPrice[selectedSize])) * 100).toFixed(0)}%!
                  </span>
                )}
                {(!originalPrice[selectedSize] || parseFloat(originalPrice[selectedSize]) <= rescuePackOptions[selectedSize].price) && "What was the original value?"}
              </p>
            </div>
          </div>

          {/* Pickup Location Info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-lg">📍</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-emerald-900 mb-1">
                  Pickup Location
                </h3>
                <p className="text-xs text-emerald-700">
                  Orders will be picked up at your store location from your profile. Make sure your location is up to date in your profile settings.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="pickupDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Pickup Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="pickupDate"
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 text-base"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Select the pickup date</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pickupStartTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pickupStartTime"
                  type="time"
                  value={pickupStartTime}
                  onChange={(e) => setPickupStartTime(e.target.value)}
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 text-base"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Earliest pickup time</p>
              </div>

              <div>
                <label htmlFor="pickupEndTime" className="block text-sm font-semibold text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <Input
                  id="pickupEndTime"
                  type="time"
                  value={pickupEndTime}
                  onChange={(e) => setPickupEndTime(e.target.value)}
                  min={pickupStartTime || undefined}
                  className="border-2 border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl py-3 text-base"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Latest pickup time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleCreateRescuePack}
          disabled={loading || !quantity || !pickupDate || !pickupStartTime || !pickupEndTime}
          className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span> Creating Rescue Pack...
            </span>
          ) : (
            `Create ${selectedSize.charAt(0).toUpperCase() + selectedSize.slice(1)} Rescue Pack`
          )}
        </Button>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400">
          Every rescue pack helps reduce food waste and supports your community 🌍
        </p>
      </main>
    </div>
  );
};

export default CreateMagicBoxPage;