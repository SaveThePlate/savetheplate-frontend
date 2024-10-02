"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import CustomCard from "./CustomCard";

interface Offer {
  id: number;
  images: { path: string }[];
  title: string;
  owner: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  user: {
    username: string;
  };
}

const BASE_IMAGE_URL = "http://localhost:3001/storage/";
const getImage = (filename: string): string => {
  return filename ? `${BASE_IMAGE_URL}${filename}` : "";
};

const OffersPage = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await axios.get("http://localhost:3001/offers");
        setOffers(response.data);
      } catch (err) {
        setError("Failed to fetch offers.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const openModal = (offer: Offer) => {
    setSelectedOffer(offer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOffer(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
      
      {offers.map((offer) => (
        <CustomCard
          key={offer.id}
          imageSrc={offer.images.length > 0 ? getImage(offer.images[0].path) : ''} 
          imageAlt={offer.title}
          title={offer.title}
          owner={
          <a href={`/profile/${offer.owner}`} className="text-blue-500 underline">
            {offer.owner}
          </a>
          }
          description={offer.description}
          expirationDate={offer.expirationDate}
          pickupLocation={offer.pickupLocation}
          reserveLink={`/reserve/${offer.id}`}
          onDetailsClick={() => openModal(offer)}

        />
      ))}

    </div>
  );
};

export default OffersPage;
