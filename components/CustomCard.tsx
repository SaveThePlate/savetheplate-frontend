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
  const [role, setRole] = useState(null);

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

        const userRole = response?.data?.role;
        setRole(userRole);
      } catch (error) {
        console.error("Error fetching role:", error);
        router.push("/onboarding");
      }
    };

    fetchUserRole();
  }, [router]);

  return (
    <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 max-w-xs">
      <Card className="flex flex-col shadow-xl border border-gray-300 rounded-lg m-4 bg-white overflow-hidden">
        <div className="w-full h-64 overflow-hidden">
          <Image
            src={imageSrc ? imageSrc : "/logo.png"}
            alt={imageAlt}
            className="w-full h-full object-cover"
            width={300}
            height={300}
          />
        </div>

        <div className="flex flex-col justify-between p-5">
          <CardHeader className="p-0">
            <CardTitle className="text-xl font-semibold text-gray-800">
              {title}
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <span className="text-gray-400 line-through">
                  {price * 2} dt
                </span>
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

            <div className="flex space-x-2 mt-3">
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-3  text-white bg-teal-500 hover:bg-teal-600 font-bold text-center rounded-lg shadow-md transition-transform transform hover:scale-105"
                >
                  📍 Pickup Location
                </a>
              )}

              <Credenza>
                <CredenzaTrigger asChild>
                  <button className="px-4 py-2 text-sm bg-teal-200 font-bold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300">
                    Details
                  </button>
                </CredenzaTrigger>
              </Credenza>
            </div>
          </CardHeader>

          <CardFooter className="flex justify-center items-center mt-4 space-x-2">
            <Credenza>
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
                    <strong>Heure de collecte :</strong> {formattedDate} à{" "}
                    {formattedTime}
                  </p>
                  <p className="text-base text-gray-700">
                    <strong>Lieu :</strong> {pickupLocation}
                  </p>

                  {mapsLink && (
                    <div className="mt-4">
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 text-white bg-teal-500 hover:bg-teal-600 font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
                      >
                        Voir sur Google Maps
                      </a>
                    </div>
                  )}
                </CredenzaBody>

                <CredenzaFooter className="flex justify-end mt-6">
                  <CredenzaClose asChild>
                    <button className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
                      Fermer
                    </button>
                  </CredenzaClose>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>

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
