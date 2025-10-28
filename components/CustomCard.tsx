"use client";

import { FC, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import axios from "axios";

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
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
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
  onEdit,
  onDelete,
}) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isExpired = new Date(expirationDate).getTime() <= new Date().getTime();

  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return router.push("/onboarding");

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRole(response?.data?.role);
      } catch {
        router.push("/onboarding");
      }
    };
    fetchUserRole();
  }, [router]);

return (
  <Card className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
    {/* Image */}
    <div className="relative w-full h-56 sm:h-64">
      <Image
        src={imageSrc || "/logo.png"}
        alt={imageAlt}
        fill
        className={`object-cover transition-all duration-300 ${
          isExpired ? "opacity-70" : "opacity-100"
        }`}
      />

      {/* Expired badge */}
      {isExpired && (
        <div className="absolute top-3 left-3 bg-red-500/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
          Expired
        </div>
      )}

      {/* Price badge */}
      <div className="absolute top-3 right-3 bg-teal-600 text-white font-semibold px-3 py-1 rounded-full text-sm shadow-md">
        {price} dt
      </div>

      {/* Quantity badge */}
      <div
        className={`absolute bottom-3 left-3 px-3 py-1 text-sm font-medium rounded-full shadow-md ${
          quantity > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-600"
        }`}
      >
        {quantity > 0 ? `${quantity} left` : "Sold Out"}
      </div>
    </div>

    {/* Content */}
    <div className="flex flex-col flex-1">
      <CardHeader className="p-2">
        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
          {title}
        </CardTitle>
        <CardDescription className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
          {description} <br />
          <span className="text-gray-800 font-medium">📍 {pickupLocation}</span>
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-5 flex flex-col gap-3">
        {/* CLIENT Buttons */}
        {role === "CLIENT" && (
          <>
            {isExpired ? (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-400 rounded-xl font-medium cursor-not-allowed"
              >
                ⌛ Expired
              </button>
            ) : quantity > 0 ? (
              <Link
                href={reserveLink}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl shadow-sm hover:bg-teal-700 transition duration-200"
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
          </>
        )}

        {/* PROVIDER Buttons */}
        {role === "PROVIDER" && (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => onEdit && onEdit(offerId)}
              className="flex-1 px-5 py-3 bg-amber-100 text-amber-800 rounded-xl font-medium shadow-sm hover:bg-amber-200 transition duration-200"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => onDelete && onDelete(offerId)}
              className="flex-1 px-5 py-3 bg-red-100 text-red-700 rounded-xl font-medium shadow-sm hover:bg-red-200 transition duration-200"
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </CardFooter>
    </div>
  </Card>
);

};

export default CustomCard;
