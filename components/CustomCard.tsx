import { FC } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import Link from 'next/link';
import Image from 'next/image';

interface CustomCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  description: string;
  expirationDate: string; 
  expirationTime: string; 
  pickupLocation: string; 
  detailsLink: string;
  reserveLink: string;
  primaryColor: string;
}

const CustomCard: FC<CustomCardProps> = ({
  imageSrc,
  imageAlt,
  title,
  description,
  expirationDate,
  expirationTime,
  pickupLocation,
  detailsLink,
  reserveLink,
  primaryColor
}) => {

  const formattedDate = new Date(expirationDate).toLocaleDateString();
  const formattedTime = new Date(expirationDate).toLocaleTimeString();

  return (
    <Card className="sm:w-60">
      <CardHeader>
        <div className="bg-gray-300 h-40 rounded-md flex items-center justify-center mb-4">
          <Image src={imageSrc} alt={imageAlt} width={240} height={160} className="object-cover rounded-md" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
       <CardContent>
        <p className="text-sm text-gray-500">Expires on: {formattedDate} at {formattedTime}</p>
        <p className="text-sm text-gray-500">Pickup Location: {pickupLocation}</p>
      </CardContent>
      <CardFooter className="flex justify-between items-center mt-auto">
        <Link href={detailsLink} className="text-gray-600 border-b-2 border-transparent hover:border-primary transition">
          Details
        </Link>
        <Link href={reserveLink} style={{ backgroundColor: primaryColor, color: 'white' }} className="px-4 py-2 rounded-md">
          Reserve
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CustomCard;
