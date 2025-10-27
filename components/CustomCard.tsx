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
      if (!token) {
        console.warn("No access token found. Redirecting to onboarding.");
        router.push("/onboarding");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setRole(response?.data?.role);
      } catch (error) {
        console.error("Error fetching role:", error);
        router.push("/onboarding");
      }
    };

    fetchUserRole();
  }, [router]);

  return (
    <div>
      <Card className="flex flex-col shadow-xl border border-gray-300 rounded-lg bg-white overflow-hidden h-full">
        {/* Image */}
        <div className="w-full h-48 sm:h-56 md:h-48 lg:h-56 relative overflow-hidden">
          <Image
            src={imageSrc || "/logo.png"}
            alt={imageAlt}
            className="object-cover"
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        </div>

        {/* Card Content */}
        <div className="flex flex-col justify-between p-5 flex-1">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {title}
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <span className="text-gray-400 line-through">{price * 2} dt</span>
                <span className="text-teal-600 font-semibold">{price} dt</span>
              </div>
            </CardTitle>

            <CardDescription className="mt-3 flex flex-col items-start gap-2">
              <span
                className={`text-lg font-bold ${
                  quantity > 0 ? "text-gray-800" : "text-red-500"
                }`}
              >
                {quantity > 0 ? `${quantity} pieces left` : "Sold Out"}
              </span>
            </CardDescription>

            {/* Location + Details Button */}
            <div className="flex space-x-2 mt-3">
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-3 text-white bg-teal-500 hover:bg-teal-600 font-bold text-center rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                  📍 Pickup Location
                </a>
              )}

              {/* ✅ FIXED: Credenza Trigger + Content are in SAME wrapper */}
              <Credenza>
                <CredenzaTrigger asChild>
                  <button className="px-4 py-2 text-sm bg-teal-200 font-bold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300">
                    Details
                  </button>
                </CredenzaTrigger>

                <CredenzaContent className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto">
                  <CredenzaHeader className="mb-4">
                    <CredenzaTitle className="text-2xl font-bold text-gray-800 mb-3">
                      {title}
                    </CredenzaTitle>
                    <CredenzaDescription className="text-gray-600 text-sm">
                      {description}
                    </CredenzaDescription>
                  </CredenzaHeader>

                  <CredenzaBody className="space-y-4">
                    <p className="text-base text-gray-700">
                      <strong>Pickup Time:</strong> {formattedDate} at {formattedTime}
                    </p>
                    <p className="text-base text-gray-700">
                      <strong>Location:</strong> {pickupLocation}
                    </p>

                    {mapsLink && (
                      <div className="mt-4">
                        <a
                          href={mapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 text-white bg-teal-500 hover:bg-teal-600 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
                        >
                          View on Google Maps
                        </a>
                      </div>
                    )}
                  </CredenzaBody>

                  <CredenzaFooter className="flex justify-end mt-6">
                    <CredenzaClose asChild>
                      <button className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
                        Close
                      </button>
                    </CredenzaClose>
                  </CredenzaFooter>
                </CredenzaContent>
              </Credenza>
            </div>
          </CardHeader>

          {/* Footer Section */}
          <CardFooter className="flex justify-center items-center mt-4 space-x-2">
            {role === "CLIENT" &&
              (quantity > 0 ? (
                <Link
                  href={reserveLink}
                  className="px-4 py-2 text-sm bg-green-500 font-bold text-white rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300"
                >
                  Order
                </Link>
              ) : (
                <button
                  disabled
                  className="px-4 py-2 text-sm bg-gray-300 font-bold text-gray-600 rounded-lg shadow-md cursor-not-allowed"
                >
                  Order
                </button>
              ))}
          </CardFooter>
        </div>
      </Card>
    </div>
  );
};

export default CustomCard;