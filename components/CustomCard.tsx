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

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

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
  const [loading, setLoading] = useState(false);

  const [localData, setLocalData] = useState({ title, description, price, quantity });
  const { date: formattedDate, time: formattedTime } = formatDateTime(expirationDate);
  const isExpired = new Date(expirationDate).getTime() <= new Date().getTime();

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

    if (!localData.title || !localData.description || Number(localData.price) < 0 || Number(localData.quantity) < 0) {
      toast.error("Please fill out all fields with valid values");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("accessToken");
    if (!token) return router.push("/signIn");

    try {
      const payload = { ...localData, price: parseFloat(localData.price as any), quantity: parseInt(localData.quantity as any, 10) };
      await axios.put(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${offerId}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Offer updated successfully");
      setLocalData(payload);
      setIsEditing(false);
      if (onUpdate) onUpdate(offerId, payload);
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
      if (onDelete) onDelete(offerId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete offer");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleImageError = (e: any) => { e.target.src = "/logo.png"; };

  return (
    <Card className={`flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 ${isExpired ? "opacity-60 pointer-events-none" : ""}`}>
      {/* Image */}
      <div className="relative w-full h-56 sm:h-64">
        <Image src={imageSrc || "/logo.png"} alt={imageAlt || "Offer image"} fill onError={handleImageError} className="object-cover transition-all duration-300" />
        <div className="absolute top-3 right-3 bg-teal-600 text-white font-semibold px-3 py-1 rounded-full text-sm shadow-md">
          {localData.price} dt
        </div>
        <div className={`absolute bottom-3 left-3 px-3 py-1 text-sm font-medium rounded-full shadow-md ${localData.quantity > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-600"}`}>
          {localData.quantity > 0 ? `${localData.quantity} left` : "Sold Out"}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        <CardHeader className="p-0">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{localData.title}</CardTitle>
          <CardDescription className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
            {localData.description} <br />
            <span className="text-gray-800 font-medium">📍 {pickupLocation}</span>
            <br />
            <span className="text-gray-700">🕑 {formattedDate} {formattedTime}</span>
            <br />
            <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-teal-700 underline ml-1" aria-label="View pickup location on map">Show Map</a>
            {" | "}
            <a href={reserveLink} target="_blank" rel="noopener noreferrer" className={`text-amber-700 underline ml-1 ${isExpired || localData.quantity === 0 ? "pointer-events-none opacity-50" : ""}`} aria-label="Reserve this offer">Reserve</a>
          </CardDescription>
        </CardHeader>

        {/* Footer Actions */}
        {role === "PROVIDER" && (
          <CardFooter className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 w-full">

            {/* Edit Modal */}
            {/* Edit Modal */}
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
      <CredenzaTitle className="text-lg font-semibold text-gray-900">Edit Offer</CredenzaTitle>
    </CredenzaHeader>
    <CredenzaBody className="flex flex-col gap-3 mt-2">
      <div className="flex flex-col">
        <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
        <input
          id="title"
          name="title"
          value={localData.title}
          onChange={handleInputChange}
          className="border border-gray-200 rounded-2xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
          disabled={loading}
          placeholder="Title"
        />
      </div>

      <div className="flex flex-col">
        <label htmlFor="description" className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="description"
          name="description"
          value={localData.description}
          onChange={handleInputChange}
          className="border border-gray-200 rounded-2xl p-2 w-full focus:ring-2 focus:ring-teal-400 outline-none"
          disabled={loading}
          placeholder="Description"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col flex-1">
          <label htmlFor="price" className="text-sm font-medium text-gray-700">Price</label>
          <input
            id="price"
            type="number"
            name="price"
            value={localData.price}
            onChange={handleInputChange}
            className="border border-gray-200 rounded-2xl p-2 focus:ring-2 focus:ring-teal-400 outline-none"
            disabled={loading}
            placeholder="Price"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">Quantity</label>
          <input
            id="quantity"
            type="number"
            name="quantity"
            value={localData.quantity}
            onChange={handleInputChange}
            className="border border-gray-200 rounded-2xl p-2 focus:ring-2 focus:ring-teal-400 outline-none"
            disabled={loading}
            placeholder="Quantity"
          />
        </div>
      </div>
    </CredenzaBody>
    <CredenzaFooter className="flex justify-end gap-3 mt-4">
      <CredenzaClose asChild>
        <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition" disabled={loading}>Cancel</button>
      </CredenzaClose>
      <button onClick={handleEdit} disabled={loading} className="px-4 py-2 bg-teal-500 text-white rounded-xl hover:opacity-90 transition">
        {loading ? "Saving..." : "Save"}
      </button>
    </CredenzaFooter>
  </CredenzaContent>
</Credenza>


            {/* Delete Modal */}
            <Credenza open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <CredenzaTrigger asChild>
                <button disabled={loading} className="w-full sm:w-1/2 px-5 py-3 rounded-xl font-medium transition-all duration-200 bg-rose-400 text-white hover:bg-rose-500 shadow-sm">
                  🗑️ Delete
                </button>
              </CredenzaTrigger>
              <CredenzaContent className="bg-white rounded-3xl shadow-xl p-6 max-w-sm mx-auto border border-gray-100">
                <CredenzaHeader>
                  <CredenzaTitle className="text-lg font-semibold text-gray-900">Confirm Deletion</CredenzaTitle>
                </CredenzaHeader>
                <CredenzaBody className="text-gray-700 text-sm mt-2">
                  Are you sure you want to delete this offer? This action cannot be undone.
                </CredenzaBody>
                <CredenzaFooter className="flex justify-end gap-3 mt-4">
                  <CredenzaClose asChild>
                    <button className="px-4 py-2 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition" disabled={loading}>Cancel</button>
                  </CredenzaClose>
                  <button onClick={handleDeleteConfirm} disabled={loading} className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:opacity-90 transition">{loading ? "Deleting..." : "Delete"}</button>
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
