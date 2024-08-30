import { FC } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from 'next/link';
import Image from 'next/image';

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
} from "./ui/credenza"

interface CustomCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  expirationDate: string; 
  pickupLocation: string; 
  reserveLink: string;
  primaryColor: string;
}

const CustomCard: FC<CustomCardProps> = ({
  imageSrc,
  imageAlt,
  title,
  description,
  expirationDate,
  pickupLocation,
  reserveLink,
}) => {

  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); 

  return (
    <Card className="sm:w-60 shadow-lg border border-gray-300 rounded-lg hover:shadow-2xl transition-shadow">
      <CardHeader>
        <div className="bg-gray-300 h-40 rounded-t-lg flex items-center justify-center mb-4 overflow-hidden">
          <Image src={imageSrc} alt={imageAlt} width={240} height={160} className="object-cover w-full h-full" />
        </div>
        <CardTitle className="text-lg font-bold text-gray-800">{title}</CardTitle>
        <CardDescription className="text-sm text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">Expires on: {formattedDate} at {formattedTime}</p>
        <p className="text-sm text-gray-500">Pickup Location: {pickupLocation}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center mt-auto">

      <Credenza>
        <CredenzaTrigger asChild>
          <button>Details</button>
        </CredenzaTrigger>
        <CredenzaContent>
          <CredenzaHeader>
            <CredenzaTitle>{title}</CredenzaTitle>
            <CredenzaDescription>
            {description}
            </CredenzaDescription>
          </CredenzaHeader>
          <CredenzaBody>
            <p className="mb-2"><strong>Expiration Date:</strong> {formattedDate}</p>
            <p className="mb-4"><strong>Expiration Time:</strong> {formattedTime}</p>
            <p className="mb-4"><strong>Pickup Location:</strong> {pickupLocation}</p>
          </CredenzaBody>
          <CredenzaFooter>
            <CredenzaClose asChild>
              <button>Close</button>
            </CredenzaClose>
          </CredenzaFooter>
        </CredenzaContent>
      </Credenza>

        <Link href={reserveLink} style={{ backgroundColor: 'green', color: 'white' }} className="px-4 py-2 rounded-md shadow-sm hover:shadow-md transition-shadow">
          Reserve
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CustomCard;
