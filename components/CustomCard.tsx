"use client";

import { FC, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
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

interface CustomCardProps {
  offerId: number;
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  price: number;
  ownerId: number;
  quantity: number;
  expirationDate: string;
  pickupLocation: string;
  mapsLink: string;
  reserveLink: string;
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, data: any) => void;
}

const CustomCard: FC<CustomCardProps> = ({
  imageSrc,
  imageAlt,
  offerId,
  title,
  description,
  price,
  ownerId,
  quantity,
  expirationDate,
  pickupLocation,
  mapsLink,
  reserveLink,
  onDelete,
  onUpdate,
}) => {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ✅ Local state for immediate UI update
  const [localData, setLocalData] = useState({
    title,
    description,
    price,
    quantity,
  });

  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isExpired = new Date(expirationDate).getTime() <= new Date().getTime();

  // Fetch user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/onboarding");
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
    if (!isEditing) return setIsEditing(true);

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
      setIsEditing(false);

      // ✅ Update displayed info instantly
      setLocalData(payload);
      if (onUpdate) onUpdate(offerId, payload);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update offer");
    }
  };

  const handleDeleteConfirm = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Offer deleted successfully");
      if (onDelete) onDelete(offerId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete offer");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Card className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
      {/* Image */}
      <div className="relative w-full h-56 sm:h-64">
        <Image
          src={imageSrc || "/logo.png"}
          alt={imageAlt}
          fill
          className={`object-cover transition-all duration-300 ${isExpired ? "opacity-70" : "opacity-100"}`}
        />
        <div className="absolute top-3 right-3 bg-teal-600 text-white font-semibold px-3 py-1 rounded-full text-sm shadow-md">
          {localData.price} dt
        </div>
        <div
          className={`absolute bottom-3 left-3 px-3 py-1 text-sm font-medium rounded-full shadow-md ${
            localData.quantity > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-600"
          }`}
        >
          {localData.quantity > 0 ? `${localData.quantity} left` : "Sold Out"}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <CardHeader className="p-0">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input
                name="title"
                value={localData.title}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
              />
              <textarea
                name="description"
                value={localData.description}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
              />
              <input
                type="number"
                name="price"
                value={localData.price}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
              />
              <input
                type="number"
                name="quantity"
                value={localData.quantity}
                onChange={handleInputChange}
                className="border border-gray-200 rounded-xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
              />
            </div>
          ) : (
            <>
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {localData.title}
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
                {localData.description} <br />
                <span className="text-gray-800 font-medium">📍 {pickupLocation}</span>
              </CardDescription>
            </>
          )}
        </CardHeader>

        {role === "PROVIDER" && (
          <CardFooter className="mt-4 flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={handleEdit}
              className={`flex-1 px-5 py-3 rounded-xl font-medium shadow-sm transition duration-200 ${
                isEditing ? "bg-teal-600 text-white hover:bg-teal-700" : "bg-amber-500 text-white hover:bg-amber-600"
              }`}
            >
              {isEditing ? "💾 Save" : "✏️ Edit"}
            </button>

            <Credenza open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <CredenzaTrigger asChild>
                <button className="flex-1 px-5 py-3 bg-red-500 text-white rounded-xl font-medium shadow-sm hover:bg-red-600 transition duration-200">
                  🗑️ Delete
                </button>
              </CredenzaTrigger>
              <CredenzaContent className="bg-white rounded-2xl shadow-lg p-6 max-w-sm mx-auto border border-gray-100">
                <CredenzaHeader>
                  <CredenzaTitle className="text-lg font-bold text-gray-800">
                    Confirm Deletion
                  </CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="text-gray-700 text-sm mt-2">
                  Are you sure you want to delete this offer? This action cannot be undone.
                </CredenzaBody>
                <CredenzaFooter className="flex justify-end gap-3 mt-6">
                  <CredenzaClose asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition duration-200">
                      Cancel
                    </button>
                  </CredenzaClose>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition duration-200"
                  >
                    Delete
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
