"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import CustomCard from "./CustomCard";

interface Offer {
  id: number;
  images: { path: string }[];
  title: string;
  ownerId: number;
  description: string;
  price: number;
  quantity: number;
  expirationDate: string;
  pickupLocation: string;
  user: {
    username: string;
  };
}

const DEFAULT_IMAGE = "/logo.png";
const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/";
const getImage = (filename: string | null): string => {
  return filename ? `${BASE_IMAGE_URL}${filename}` : DEFAULT_IMAGE;
};

const OffersPage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken'); 

    const fetchUserRole = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/users/get-role', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 200) {
          setUserRole(response.data.role); // Set the user role in state
        } else {
          console.error('Failed to fetch user role:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching user role:');
      }
    };

    fetchUserRole();
  }, []);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + "/offers");
        setOffers(response.data);
      } catch (err) {
        setError("Failed to fetch offers.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);


  if (loading) return <div>Loading... </div>;
  if (error) return <div>{error} </div>;

  return (
    
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
      
      {offers.map((offer) => (
        <CustomCard
          key={offer.id}
          offerId={offer.id}
          imageSrc={offer.images.length > 0 ? getImage(offer.images[0].path) : ''} 
          imageAlt={offer.title}
          title={offer.title}
          ownerId={offer.ownerId}
          description={offer.description}
          price={offer.price}
          quantity={offer.quantity}
          expirationDate={offer.expirationDate}
          pickupLocation={offer.pickupLocation}
          reserveLink={`/client/offers/${offer.id}`}
          userRole={userRole}
        />
      ))}

    </div>
  );
};

export default OffersPage;
