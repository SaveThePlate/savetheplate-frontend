import { FC } from "react";
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
  // userRole: 'CLIENT' | 'PROVIDER' | null;
  // onDelete: (offerId: number) => void;
}

const CustomCard: FC<CustomCardProps> = ({
  offerId,
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
  // userRole,
  // onDelete,
}) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const router = useRouter();

  return (
    <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 max-w-xs">
      <Card className="flex flex-col shadow-lg border border-gray-200 rounded-lg hover:shadow-2xl transition-transform transform hover:scale-105 m-3 bg-white overflow-hidden">
        <div className="">
          <Image
            src={imageSrc ? imageSrc : "/logo.png"}
            alt={imageAlt}
            className=" w-full h-full"
            width={300}
            height={300}
          />
        </div>

        <div className="flex flex-col justify-between p-5 w-full md:w-2/3 bg-white">
          <CardHeader className="p-0">
            <CardTitle className="text-lg font-semibold text-gray-800">
              {title}
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <span className="text-gray-400 line-through">
                  {price * 2} dt
                </span>
                <span className="text-teal-600 font-semibold">{price} dt</span>
              </div>
            </CardTitle>
            <CardDescription className="mt-3 flex flex-col items-start gap-4">
              <span
                className={`text-lg font-bold ${
                  quantity > 0 ? "text-gray-800" : "text-red-500"
                }`}
              >
                {quantity > 0 ? `${quantity} pieces left` : "Sold Out"}
              </span>

              {/* {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className=" text-center px-4 py-2 text-sm bg-teal-500 text-white font-bold rounded-full shadow-md hover:bg-teal-600 transition-colors duration-300 transform hover:scale-105"
                >
                  View on Google Maps
                </a>
              )} */}

            </CardDescription>
            <button  className="text-base hover:underline text-teal-500">
              Pickup Location: {mapsLink}
            </button>
          </CardHeader>

          <CardFooter className="flex justify-between items-center p-0 mt-4 space-x-2">
            <Credenza>
              <CredenzaTrigger asChild>
                <button className="px-4 py-2 text-xs bg-[#fffc5ed3] text-black font-bold sm:text-lg border border-gray-300 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300">
                  Details
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-lg shadow-lg p-6 max-w-lg mx-auto">
                {/* Modal Header */}
                <CredenzaHeader className="mb-4">
                  <CredenzaTitle className="text-2xl font-bold text-gray-800 mb-3">
                    {title}
                  </CredenzaTitle>
                  <CredenzaDescription className="text-gray-600 text-sm">
                    {description}
                  </CredenzaDescription>
                </CredenzaHeader>

                {/* Modal Body */}
                <CredenzaBody className="space-y-4">
                  {/* Pickup Time */}
                  <p className="text-base text-gray-700">
                    <strong>Heure de collecte :</strong> {formattedDate} à{" "}
                    {formattedTime}
                  </p>

                  {/* Location Information */}
                  <p className="text-base text-gray-700">
                    <strong>Lieu :</strong> {pickupLocation}
                  </p>

                  {/* Maps Link */}
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

                  <p className="text-base text-blue-700 mt-4 font-medium">
                    Ne manquez pas cette occasion ! Assurez-vous de récupérer
                    votre commande à l&apos;heure indiquée pour en profiter.
                  </p>
                </CredenzaBody>

                {/* Modal Footer */}
                <CredenzaFooter className="flex justify-end mt-6">
                  <CredenzaClose asChild>
                    <button className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-transform transform hover:scale-105">
                      Fermer
                    </button>
                  </CredenzaClose>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>

            {/* {quantity > 0 ? (
              <Link
                href={reserveLink}
                className="px-4 py-2 text-xs bg-[#fffc5ed3] font-bold sm:text-lg border border-black bg-gradient-to-r from-green-400 to-teal-500 text-black rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300"
              >
                Order
              </Link>
            ) : (
              <button
                disabled
                className="px-4 py-2 text-xs bg-gray-300 font-bold sm:text-lg border border-gray-400 text-gray-600 rounded-full shadow-md cursor-not-allowed"
              >
                Order
              </button>
            )} */}

          </CardFooter>
        </div>
      </Card>
    </div>
  );
};

export default CustomCard;
