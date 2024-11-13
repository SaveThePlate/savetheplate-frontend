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

  const handleDeleteOffer = async (offerId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token found");
  
      await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/offers/${offerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success("Offer deleted successfully!");
      onDelete(offerId);  
    } catch (err) {
      toast.success("Failed to delete offer");
    }
  };

  return (
<Card className="w-full sm:w-full md:w-96 lg:w-full shadow-lg border border-gray-200 rounded-lg hover:shadow-2xl transition-transform transform hover:scale-105 m-3 bg-white overflow-hidden">
  <div className="flex items-start pr-6">
    
    {/* Image Section */}
    <div className="w-1/3 h-32 md:h-40 lg:h-48 rounded-l-lg overflow-hidden relative pt-6">
      {/* <Image
        src={imageSrc}
        alt={imageAlt}
        width={300}
        height={300}
        className="object-cover w-full h-full"
      /> */}
          {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            className="object-cover w-full h-full"
            width={300}
            height={300}
          />
        ) : (
          <Image src="/logo.png" alt="Default Item Image" className="w-20 h-20 object-cover rounded-md" />
        )}
    

      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 hover:opacity-20 transition-opacity duration-300"></div>
    </div>

    {/* Content Section */}
    <div className="flex flex-col justify-between p-5 w-2/3 bg-white rounded-r-lg">
      <CardHeader className="p-0">
        <CardTitle className="flex justify-between items-center text-lg font-semibold text-gray-800">
          <span>{title}</span>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <span className="text-gray-400 line-through">{price * 2} dt</span>
            <span className="text-teal-600 font-semibold">{price} dt</span>
          </div>
        </CardTitle>
        <CardTitle className="text-sm font-semibold text-gray-500 mt-1">
          {quantity} pieces left
        </CardTitle>
        <CardDescription className="text-xs text-gray-700 mt-1">
          <Link href={`./profile/${ownerId}`} className="hover:underline text-teal-500">
            {pickupLocation}
          </Link>
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

        {/* Conditional Rendering for Buttons */}
        {userRole === 'CLIENT' ? (
          <Link
            href={reserveLink}
            className="px-4 py-2 text-xs bg-[#fffc5ed3] font-bold sm:text-lg border border-black bg-gradient-to-r from-green-400 to-teal-500 text-black rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300">
            Order
          </Link>
        ) : userRole === 'PROVIDER' ? (
          <Button
            onClick={() => handleDeleteOffer(offerId)}
            className="px-4 py-2 text-xs bg-[#fa6363d3] text-white rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300">
            Delete Offer
          </Button>
        ) : null}
      </CardFooter>
    </div>
  </div>
</Card>

  );
};

export default CustomCard;
