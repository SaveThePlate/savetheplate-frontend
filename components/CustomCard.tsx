"use client";

import { FC } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
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

interface CustomCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  owner: React.ReactNode;
  ownerId: number;
  description: string;
  price: number;
  expirationDate: string;
  pickupLocation: string;
  reserveLink: string;
}

const CustomCard: FC<CustomCardProps> = ({
  imageSrc,
  imageAlt,
  title,
  owner,
  ownerId,
  description,
  price,
  expirationDate,
  pickupLocation,
  reserveLink,
}) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="w-full sm:w-72 md:w-80 lg:w-96 shadow-lg border border-indigo-300 rounded-lg hover:shadow-2xl transition-shadow transform hover:scale-105 m-4">
      <CardHeader>
        <div className="bg-gray-100 h-48 rounded-t-lg flex items-center justify-center mb-4 overflow-hidden">
          <Image src={imageSrc} alt={imageAlt} width={300} height={300} className="object-cover w-full h-full" />
        </div>
        <CardTitle className="flex justify-between items-center text-xl font-semibold text-gray-900">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 line-through">{price * 2} dt</span>
            <span className="text-red-600">{price} dt</span>
          </div>
        </CardTitle>
        <CardTitle className="text-sm text-gray-700">
          <a href={`/profile/${ownerId}`} className="hover:underline text-black-600">{owner}</a>
        </CardTitle>
        <hr className="my-2"/>
        <CardDescription className="text-base text-gray-600">{description}</CardDescription>
      </CardHeader>


      <CardFooter className="flex justify-between items-center mt-4">
        <Credenza>
          <CredenzaTrigger asChild>
            <button className="px-6 py-2 rounded-md bg-sky-500 text-white text-lg shadow-md hover:bg-sky-600 transition-colors">Details</button>
          </CredenzaTrigger>

          <CredenzaContent className="bg-white rounded-lg shadow-lg p-6">
            <CredenzaHeader>
              <CredenzaTitle className="text-2xl font-bold text-gray-800 mb-2">{title}</CredenzaTitle>
              <CredenzaDescription className="text-gray-600 mb-4">{description}</CredenzaDescription>
            </CredenzaHeader>
            <CredenzaBody>
              <p className="mb-2 text-gray-700"><strong>Expiration Date:</strong> {formattedDate}</p>
              <p className="mb-4 text-gray-700"><strong>Expiration Time:</strong> {formattedTime}</p>
              <p className="mb-4 text-gray-700"><strong>Pickup Location:</strong> {pickupLocation}</p>
            </CredenzaBody>
            <CredenzaFooter className="flex justify-end mt-4">
              <CredenzaClose asChild>
                <button className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow hover:bg-red-600 transition duration-200">
                  Close
                </button>
              </CredenzaClose>
            </CredenzaFooter>
          </CredenzaContent>


        </Credenza>

        <Link
          href={reserveLink}
          className="px-6 py-2 rounded-md bg-green-500 text-white text-lg shadow-md hover:bg-green-600 transition-colors">
          Order
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CustomCard;
