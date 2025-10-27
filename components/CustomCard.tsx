"use client";

import { FC, useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import {
  Credenza,
  CredenzaBody,
  CredenzaClose,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaTrigger,
} from "./ui/credenza";
import { useRouter } from "next/navigation";
import axios from "axios";

interface CustomCardProps {
  offerId: number;
  imageSrc: string;
  imageAlt: string;
  title: string;
  ownerId: number;
  description: string;
  price: number;
  quantity: number;
  expirationDate: string;
  pickupLocation: string;
  mapsLink: string;
  reserveLink: string;
}

const CustomCard: FC<CustomCardProps> = ({
  imageSrc,
  imageAlt,
  title,
  ownerId,
  description,
  price,
  quantity,
  expirationDate,
  pickupLocation,
  mapsLink,
  reserveLink,
}) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

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
<Card className="flex flex-col bg-white rounded-3xl overflow-hidden shadow-md transition-shadow duration-300">
  {/* Image */}
<div className="relative w-full h-52 sm:h-60">
  <Image
    src={imageSrc || "/logo.png"}
    alt={imageAlt}
    fill
    className="object-cover"
  />


  {/* Price badge */}
  <div className="absolute top-3 right-3 bg-teal-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-md">
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
  <div className="flex flex-col p-5 flex-1">
    <CardHeader className="p-0">
      <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
        {title}         
      </CardTitle>
      <CardDescription className="mt-2 text-sm text-gray-600">
        {description} Find it at <strong>{pickupLocation}</strong>
      </CardDescription>

      {/* Actions */}
      <div className="mt-4 flex gap-3 flex-wrap">
        {mapsLink && (
          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors duration-200"
          >
            📍 Pickup
          </a>
        )}

<Credenza>
  <CredenzaTrigger asChild>
    <button className="text-sm px-4 py-2 bg-gray-50 text-gray-900 rounded-xl shadow-sm hover:bg-gray-100 transition-colors duration-200">
      Details
    </button>
  </CredenzaTrigger>
  <CredenzaContent className="bg-white rounded-2xl shadow-lg p-5 max-w-sm mx-auto border border-gray-100">
    <CredenzaHeader className="mb-3">
      <CredenzaTitle className="text-xl font-bold text-gray-800">{title}</CredenzaTitle>
      <CredenzaDescription className="text-gray-600 text-sm">{description}</CredenzaDescription>
    </CredenzaHeader>
    <CredenzaBody className="space-y-2 text-gray-700 text-sm">
      <p>
        <strong>Pickup Time:</strong> {formattedDate} at {formattedTime}
      </p>
      <p>
        <strong>Location:</strong> {pickupLocation}
      </p>
      {mapsLink && (
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-xl shadow-sm hover:bg-teal-100 transition-colors duration-200"
        >
          View on Google Maps
        </a>
      )}
    </CredenzaBody>
    <CredenzaFooter className="flex justify-end mt-4">
      <CredenzaClose asChild>
        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-xl shadow-sm hover:bg-red-100 transition-colors duration-200">
          Close
        </button>
      </CredenzaClose>
    </CredenzaFooter>
  </CredenzaContent>
</Credenza>

      </div>
    </CardHeader>

    <CardFooter className="mt-5 flex justify-center">
      {role === "CLIENT" &&
        (quantity > 0 ? (
          <Link
            href={reserveLink}
            className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white font-semibold rounded-xl shadow-md hover:bg-teal-700 transition-colors duration-200"
          >
            🛒 Order
          </Link>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-400 rounded-xl cursor-not-allowed"
          >
            🛒 Sold Out
          </button>
        ))}
    </CardFooter>
  </div>
  
</Card>

);

};

export default CustomCard;
