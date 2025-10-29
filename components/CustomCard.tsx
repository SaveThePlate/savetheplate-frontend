"use client";

import { FC, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
  CredenzaFooter,
  CredenzaClose,
} from "@/components/ui/credenza";

const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return { date: "N/A", time: "" };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { date: "Invalid date", time: "" };
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

interface CustomCardProps {
  offerId: number;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description: string;
  price: number;
  ownerId: number;
  quantity: number;
  expirationDate?: string;
  pickupLocation: string;
  mapsLink?: string;
  reserveLink?: string;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, data: any) => void;
}

const CustomCard: FC<CustomCardProps> = ({
  imageSrc = "/logo.png",
  imageAlt = "Offer image",
  offerId,
  title,
  description,
  price,
  ownerId,
  quantity,
  expirationDate,
  pickupLocation,
  mapsLink = "#",
  reserveLink = "#",
  onDelete,
  onUpdate,
}) => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [localData, setLocalData] = useState({
    title,
    description,
    price,
    quantity,
  });

  const { date: formattedDate, time: formattedTime } = formatDateTime(expirationDate);
  const isExpired =
    expirationDate && new Date(expirationDate).getTime() <= new Date().getTime();

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/onboarding");
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setRole(response?.data?.role);
      } catch {
        router.push("/onboarding");
      }
    };
    fetchUserRole();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = async () => {
    if (!localData.title || !localData.description) {
      toast.error("Please fill out all fields");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    try {
      const payload = {
        ...localData,
        price: parseFloat(localData.price as any),
        quantity: parseInt(localData.quantity as any, 10),
      };
      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${offerId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Offer updated successfully");
      setLocalData(payload);
      setIsEditing(false);
      onUpdate?.(offerId, payload);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update offer");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Offer deleted successfully");
      onDelete?.(offerId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete offer");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleImageError = (e: any) => {
    e.target.src = "/logo.png";
  };

  return (
    <Card
      className={`flex flex-col bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 ${
        isExpired ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* 🖼️ Image */}
      <div className="relative w-full h-56 sm:h-64">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          onError={handleImageError}
          className="object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
        <div className="absolute top-3 right-3 bg-teal-600 text-white font-semibold px-3 py-1 rounded-full text-sm shadow-md">
          {localData.price} dt
        </div>
        <div
          className={`absolute bottom-3 left-3 px-3 py-1 text-sm font-medium rounded-full shadow-md ${
            localData.quantity > 0
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-600"
          }`}
        >
          {localData.quantity > 0 ? `${localData.quantity} left` : "Sold Out"}
        </div>
      </div>

      {/* 📋 Content */}
      <div className="flex flex-col flex-1 p-5">
        <CardHeader className="p-0">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
            {localData.title}
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 leading-relaxed line-clamp-3">
            {localData.description}
          </CardDescription>

          <div className="mt-3 space-y-1 text-sm text-gray-700">
            <p>📍 <span className="font-medium text-gray-800">{pickupLocation}</span></p>

            <div className="flex flex-wrap gap-2 mt-2 text-sm">
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 font-medium underline hover:text-teal-800"
                >
                  Show Map
                </a>
              )}
              
              <p>🕑 {formattedDate} {formattedTime}</p>

            </div>
          </div>
        </CardHeader>

{/* 🧾 Details Modal */}
<div className="mt-4 flex justify-center">
  <Credenza>
    <CredenzaTrigger asChild>
      <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow transition-all duration-150">
        🔎 Details
      </button>
    </CredenzaTrigger>

    <CredenzaContent className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto border border-gray-100">
      <CredenzaHeader className="mb-3">
        <CredenzaTitle className="text-xl font-bold text-gray-900">
          {localData.title}
        </CredenzaTitle>
      </CredenzaHeader>

      <CredenzaBody className="space-y-3 text-gray-700 text-sm">
        <p>{localData.description}</p>
        <p><strong>Pickup Time:</strong> {formattedDate} at {formattedTime}</p>
        <p><strong>Location:</strong> {pickupLocation}</p>

        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl shadow-sm hover:bg-teal-100 transition-colors"
          >
            View on Google Maps
          </a>
        )}
      </CredenzaBody>

      <CredenzaFooter className="flex justify-end gap-3 mt-5">
        <Link
          href={`/offers/${offerId}`}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl shadow-sm hover:bg-teal-700 transition"
        >
          View Full Offer
        </Link>
        <CredenzaClose asChild>
          <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition">
            Close
          </button>
        </CredenzaClose>
      </CredenzaFooter>
    </CredenzaContent>
  </Credenza>
</div>

        {/* 🧭 Footer Buttons */}
        {role === "CLIENT" && (
          <CardFooter className="mt-5 flex flex-col gap-3 w-full">
            {isExpired ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed"
              >
                ⌛ Expired
              </button>
            ) : localData.quantity > 0 ? (
              <Link
                href={reserveLink}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl shadow-sm hover:bg-teal-700 transition"
              >
                🛒 Order
              </Link>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed"
              >
                🛒 Sold Out
              </button>
            )}
          </CardFooter>
        )}

        {role === "PROVIDER" && (
          <CardFooter className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 w-full">
            {/* ✏️ Edit Modal */}
            <Credenza open={isEditing} onOpenChange={setIsEditing}>
              <CredenzaTrigger asChild>
                <button
                  disabled={loading}
                  className="w-full sm:w-1/2 px-5 py-3 rounded-xl font-medium transition-all duration-200 bg-amber-400 text-white hover:bg-amber-500 shadow-sm"
                >
                  ✏️ Edit
                </button>
              </CredenzaTrigger>
              <CredenzaContent className="bg-white rounded-3xl shadow-xl p-6 max-w-md mx-auto border border-gray-100">
                <CredenzaHeader>
                  <CredenzaTitle className="text-lg font-semibold text-gray-900">
                    Edit Offer
                  </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="flex flex-col gap-3 mt-3">
                  <div className="flex flex-col">
                    <label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      value={localData.title}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-2xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex flex-col">
                    <label htmlFor="description" className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={localData.description}
                      onChange={handleInputChange}
                      className="border border-gray-200 rounded-2xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col flex-1">
                      <label htmlFor="price" className="text-sm font-medium text-gray-700">
                        Price
                      </label>
                      <input
                        id="price"
                        type="number"
                        name="price"
                        value={localData.price}
                        onChange={handleInputChange}
                        className="border border-gray-200 rounded-2xl p-2 focus:ring-2 focus:ring-teal-400 outline-none"
                        disabled={loading}
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
                        Quantity
                      </label>
                      <input
                        id="quantity"
                        type="number"
                        name="quantity"
                        value={localData.quantity}
                        onChange={handleInputChange}
                        className="border border-gray-200 rounded-2xl p-2 focus:ring-2 focus:ring-teal-400 outline-none"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </CredenzaBody>
                <CredenzaFooter className="flex justify-end gap-3 mt-4">
                  <CredenzaClose asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition">
                      Cancel
                    </button>
                  </CredenzaClose>
                  <button
                    onClick={handleEdit}
                    disabled={loading}
                    className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:opacity-90 transition"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>

            {/* 🗑️ Delete Modal */}
            <Credenza open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <CredenzaTrigger asChild>
                <button
                  disabled={loading}
                  className="w-full sm:w-1/2 px-5 py-3 rounded-xl font-medium transition-all duration-200 bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
                >
                  🗑️ Delete
                </button>
              </CredenzaTrigger>
              <CredenzaContent className="bg-white rounded-3xl shadow-xl p-6 max-w-sm mx-auto border border-gray-100">
                <CredenzaHeader>
                  <CredenzaTitle className="text-lg font-semibold text-gray-900">
                    Confirm Deletion
                  </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="text-gray-700 text-sm mt-2">
                  Are you sure you want to delete this offer? This action cannot be undone.
                </CredenzaBody>
                <CredenzaFooter className="flex justify-end gap-3 mt-4">
                  <CredenzaClose asChild>
                    <button
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </CredenzaClose>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={loading}
                    className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:opacity-90 transition"
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>
          </CardFooter>
        )}
      </div>
    </Card>
  );
};

export default CustomCard;
