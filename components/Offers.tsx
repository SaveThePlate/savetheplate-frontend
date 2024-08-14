"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import CustomCard from "./CustomCard";

interface Offer {
  id: number;
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

const OffersPage: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
      {offers.map((offer) => (
        <CustomCard
          key={offer.id}
          imageSrc={offer.imageSrc}
          imageAlt={offer.imageAlt}
          title={offer.title}
          description={offer.description}
          expirationDate={offer.expirationDate}
          expirationTime={offer.expirationTime}
          pickupLocation={offer.pickupLocation}
          detailsLink={`/offers/${offer.id}`}
          reserveLink={`/reserve/${offer.id}`}
          primaryColor={offer.primaryColor}
        />
      ))}
    </div>
  );
};

export default OffersPage;
