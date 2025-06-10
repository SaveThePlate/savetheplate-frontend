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
  mapsLink: string;
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
    if (!token) {
      setError("No access token found. Please log in again.");
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/users/get-role', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 200) {
          setUserRole(response.data.role);
        } else {
          console.error('Failed to fetch user role:', response.data.message);
          setError('Failed to fetch user role: ' + response.data.message);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setError('Error fetching user role. Please try again.');
      }
    };

    const fetchOffers = async () => {
      try {
        const response = await axios.get(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/offers",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setOffers(response.data);
      } catch (err) {
        console.error("Failed to fetch offers:", err);
        setError("Failed to fetch offers. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    // Fetch both user role and offers
    Promise.all([fetchUserRole(), fetchOffers()]).catch((err) => {
      console.error("Error during data fetching:", err);
      setError("Something went wrong. Please try again later.");
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading offers...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">No offers available at the moment.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-6">
      {offers
        .sort((a, b) => (a.quantity === 0 ? 1 : b.quantity === 0 ? -1 : 0))
        .map((offer) => (
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
            mapsLink={offer.mapsLink}
            reserveLink={`/client/offers/${offer.id}`}
          />
        ))}
    </div>
  );
};

export default OffersPage;
