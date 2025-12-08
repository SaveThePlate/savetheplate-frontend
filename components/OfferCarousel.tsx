import React, { useState, useEffect } from "react";
import axios from "axios";
import Slider from "react-slick"; 
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";



const DEFAULT_BAG_IMAGE = "/defaultBag.png";

const getImage = (filename: string | null): string => {
  if (!filename) return DEFAULT_BAG_IMAGE;
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  if (backendUrl) {
    return `${backendUrl}/storage/${filename}`;
  }
  return DEFAULT_BAG_IMAGE;
};

interface Offer {
  id: number;
  ownerId: string;
  images: { path: string }[];
  title: string;
  description: string;
  expirationDate: string;
  pickupLocation: string;
  latitude: number;
  longitude: number;
}

interface Props {
  ownerId: string; // Expect ownerId as a prop
}

const OfferCarousel: React.FC<Props> = ({ ownerId }) => {
  const { t } = useLanguage();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  };

  // Fetch offers from the backend
  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        router.push("/signIn");
        return;
      }
      try {
        const response = await axios.get(
          process.env.NEXT_PUBLIC_BACKEND_URL + "/offers",{
            headers: { Authorization: `Bearer ${token}` },
        });
        setOffers(response.data);
        setLoading(false); // Set loading to false after data is fetched
      } catch (error) {
        setError(t("offer_carousel.load_failed"));
        setLoading(false);
      }
    };

    fetchOffers();
  }, [ownerId, offers, router, t]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        router.push("/signIn");
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUserId(response.data.id);
        setUserRole(response.data.role);
      } catch (error) {
        console.error("Error fetching user details:", error);
        setError(t("offer_carousel.fetch_user_failed"));
      }
    };

    fetchUserDetails();
  }, [router, t]); 
  


  // Group offers by owner
  const offersByOwner: Record<string, Offer[]> = offers.reduce(
    (groups, offer) => {
      // Check if the offer has a valid owner
      if (offer && offer.ownerId) {
        groups[offer.ownerId] = groups[offer.ownerId] || [];
        groups[offer.ownerId].push(offer);
      } else {
        console.warn('Offer is missing owner:', offer); // Warn about malformed data
      }
      return groups;
    },
    {} as Record<string, Offer[]>
  );
  


  return (
    <div className="w-full">
    <ToastContainer/>
    {Object.entries(offersByOwner).map(([ownerId, ownerOffers]) => (
  <div key={ownerId} className="mb-3"> {/* Reduced margin-bottom */}
    <Slider {...carouselSettings}>
      {ownerOffers.map((offer) => (
        <div key={offer.id} className="p-3"> {/* Reduced padding */}
          <h3 className="text-lg font-semibold mb-6">Offers by {offer.pickupLocation}</h3> {/* Smaller title size */}

          <div className="bg-white shadow rounded-lg p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-shrink-0">
                <Image
                width={80} 
                height={80} 
                src={sanitizeImageUrl(offer.images.length > 0 ? getImage(offer.images[0].path) : DEFAULT_BAG_IMAGE)}
                alt={offer.title}
                className="h-16 rounded-md"
                unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(offer.images.length > 0 ? getImage(offer.images[0].path) : DEFAULT_BAG_IMAGE))}
                />
            </div>

            <div className="flex-grow">
                <h4 className="text-md font-semibold mt-2">{offer.title}</h4> {/* Title under image */}
                <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500"> {/* Pickup time */}
                    Pickup time: {new Date(offer.expirationDate).toLocaleDateString()}
                </p>

                {/* Button */}
                {userRole === "CLIENT" && (
                    <Link
                    href={`/client/offers/${offer.id}`}
                    className="px-3 py-1 text-xs bg-[#fffc5ed3] font-bold sm:text-sm border border-black rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300"
                    >
                    Order
                    </Link>
                )}
                </div>
            </div>
            </div>

        </div>
      ))}
    </Slider>
  </div>
))}

    </div>
  );
};

export default OfferCarousel;
