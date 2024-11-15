import { FC } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { Credenza, CredenzaBody, CredenzaClose, CredenzaContent, CredenzaDescription, CredenzaFooter, CredenzaHeader, CredenzaTitle, CredenzaTrigger } from "./ui/credenza";
import { Button } from "./ui/button";
import { useRouter} from "next/navigation";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  reserveLink: string;
  userRole: 'CLIENT' | 'PROVIDER' | null;
  onDelete: (offerId: number) => void;
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
  reserveLink,
  userRole,
  onDelete,
}) => {

  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const router = useRouter();

 

  return (
<div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 max-w-xs">
  {/* <Card className="flex flex-col md:flex-row w-full sm:w-full md:w-1/2 lg:w-1/3 xl:w-1/4 shadow-lg border border-gray-200 rounded-lg hover:shadow-2xl transition-transform transform hover:scale-105 m-3 bg-white overflow-hidden"> */}
  <Card className="flex flex-col shadow-lg border border-gray-200 rounded-lg hover:shadow-2xl transition-transform transform hover:scale-105 m-3 bg-white overflow-hidden">
 
    {/* Image Section */}
    <div className="w-full md:w-1/3 h-48 md:h-auto rounded-l-lg overflow-hidden relative">
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          className="object-cover w-full h-full"
          width={300}
          height={300}
        />
      ) : (
        <Image
          src="/logo.png"
          alt="Default Item Image"
          className="object-cover w-20 h-20 mx-auto mt-6"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
    </div>

    {/* Content Section */}
    <div className="flex flex-col justify-between p-5 w-full md:w-2/3 bg-white">
    <CardHeader className="p-0">
      <CardTitle className="text-lg font-semibold text-gray-800">
        {title}
        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
          <span className="text-gray-400 line-through">{price * 2} dt</span>
          <span className="text-teal-600 font-semibold">{price} dt</span>
        </div>
      </CardTitle>
      <CardDescription className="mt-3 flex items-center gap-2">
        <span
          className={`text-lg font-bold ${
            quantity > 0 ? "text-gray-800" : "text-red-500"
          }`}
        >
          {quantity > 0 ? `${quantity} pieces left` : "Sold Out"}
        </span>
        {quantity > 0 && (
          <Link
            href={`./profile/${ownerId}`}
            className="text-sm hover:underline text-teal-500"
          >
            {pickupLocation}
          </Link>
        )}
      </CardDescription>
    </CardHeader>


      <CardFooter className="flex justify-between items-center p-0 mt-4 space-x-2">
        <Credenza>
          <CredenzaTrigger asChild>
            <button className="px-4 py-2 text-xs bg-[#fffc5ed3] text-black font-bold sm:text-lg border border-gray-300 rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300">
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
                <button className="px-4 py-2 bg-gradient-to-r from-red-400 to-red-600 text-white rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300">
                  Close
                </button>
              </CredenzaClose>
            </CredenzaFooter>
          </CredenzaContent>
        </Credenza>

        {quantity > 0 ? (
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
        )}

       
      </CardFooter>
    </div>
  </Card>
</div>


  );
};

export default CustomCard;
