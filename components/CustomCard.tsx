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
  ownerId: number;
  description: string;
  price: number;
  quantity: number;
  expirationDate: string;
  pickupLocation: string;
  reserveLink: string;
  userRole: 'CLIENT' | 'PROVIDER' | null; 
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
  reserveLink,
  userRole, 
}) => {
  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="w-full sm:w-full md:w-96 lg:w-full shadow-md border border-gray-200 rounded-lg hover:shadow-xl transition-shadow transform hover:scale-105 m-3">
      <div className="flex items-start">
        {/* Image Section */}
        <div className="w-1/3 h-32 md:h-40 lg:h-48 rounded-l-lg overflow-hidden">
          <Image src={imageSrc} alt={imageAlt} width={300} height={300} className="object-cover w-full h-full" />
        </div>


        {/* Content Section */}
        <div className="flex flex-col justify-between p-4 w-2/3">
          <CardHeader className="p-0">
            {/* Title and Price Section */}
            <CardTitle className="flex justify-between items-center text-lg font-semibold text-gray-800">
              <span>{title}</span>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-400 line-through">{price * 2} dt</span>
                <span className="text-green-600">{price} dt</span>
              </div>
            </CardTitle>
            <CardTitle className="flex justify-between items-center text-sm font-semibold text-gray-500">
          <span>{quantity} pieces left</span>
        </CardTitle>

            {/* Owner Section */}
            <CardDescription className="text-xs text-black-700 mt-1">
              <Link href={`./profile/${ownerId}`} className="hover:underline">
                {pickupLocation}
              </Link>
            </CardDescription>
          </CardHeader>

          {/* Footer Section */}
          <CardFooter className="flex justify-between items-center p-0 mt-2">
            <Credenza>
              <CredenzaTrigger asChild>
                {/* Updated Details Button */}
                <button className="px-4 py-2 text-xs bg-gradient-to-r from-blue-400 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform duration-300">
                  Details
                </button>
              </CredenzaTrigger>

              <CredenzaContent className="bg-white rounded-lg shadow-lg p-4">
                <CredenzaHeader>
                  <CredenzaTitle className="text-xl font-semibold text-gray-800 mb-2">{title}</CredenzaTitle>
                  <CredenzaDescription className="text-gray-600">{description}</CredenzaDescription>
                </CredenzaHeader>
                <CredenzaBody>
                  <p className="text-sm text-gray-700"><strong>Expires:</strong> {formattedDate} at {formattedTime}</p>
                  <p className="text-sm text-gray-700"><strong>Location:</strong> {pickupLocation}</p>
                </CredenzaBody>
                <CredenzaFooter className="flex justify-end mt-4">
                  <CredenzaClose asChild>
                    {/* Updated Close Button */}
                    <button className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform duration-300">
                      Close
                    </button>
                  </CredenzaClose>
                </CredenzaFooter>
              </CredenzaContent>
            </Credenza>

            {/* Conditional Rendering for Buttons */}
            {userRole === 'CLIENT' ? (
              <Link
                href={reserveLink}
                className="px-4 py-2 text-xs bg-gradient-to-r from-green-400 to-teal-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform duration-300">
                Order
              </Link>
            ) : userRole === 'PROVIDER' ? (
              <Link
                href={`/edit/${ownerId}`} // Example link for the edit action
                className="px-4 py-2 text-xs bg-gradient-to-r from-orange-400 to-yellow-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform duration-300">
                Edit
              </Link>
            ) : null}
          </CardFooter>
        </div>
      </div>
    </Card>
  );
};

export default CustomCard;
