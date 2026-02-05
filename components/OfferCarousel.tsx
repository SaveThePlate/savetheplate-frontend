import React, { useState, useEffect, memo, useMemo, useCallback } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import dynamic from "next/dynamic";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { getBackendOrigin } from "@/lib/backendOrigin";

// Lazy load react-slick to reduce initial bundle size
const Slider = dynamic(() => import("react-slick"), { 
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-32 rounded" />
});



const DEFAULT_BAG_IMAGE = "/defaultBag.png";

const getImage = (filename: string | null): string => {
  if (!filename) return DEFAULT_BAG_IMAGE;
  const backendUrl = getBackendOrigin();
  if (backendUrl) {
    return `${backendUrl}/store/${filename}`;
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
  owner?: {
    id?: number;
    username?: string;
    location?: string;
  };
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

  // Memoize carousel settings to prevent re-creation
  const carouselSettings = useMemo(() => ({
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
  }), []);

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
        const response = await axiosInstance.get(
          "/offers",{
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
    // Removed 'offers' from dependencies to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, router, t]);

  useEffect(() => {
    // Parse userId from token instead of making API call
    // UserContext already handles fetching user details globally
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/signIn");
      return;
    }

    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      setUserId(tokenPayload?.id);
      // Note: For userRole, ideally use UserContext instead of local state
      // But keeping this minimal change for now
    } catch (error) {
      console.error("Error parsing token:", error);
      setError(t("offer_carousel.fetch_user_failed"));
      router.push("/signIn");
    }
  }, [router, t]); 
  


  // Memoize grouped offers to prevent unnecessary recalculations
  const offersByOwner: Record<string, Offer[]> = useMemo(() => 
    offers.reduce(
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
    ),
    [offers]
  );
  


  return (
    <div className="w-full">
    {Object.entries(offersByOwner).map(([ownerId, ownerOffers]) => (
  <div key={ownerId} className="mb-3"> {/* Reduced margin-bottom */}
    <Slider {...carouselSettings}>
      {ownerOffers.map((offer) => (
        <div key={offer.id} className="p-3"> {/* Reduced padding */}
          <h3 className="text-lg font-semibold mb-6">Offers by {offer.owner?.username || offer.pickupLocation}</h3> {/* Prefer store name (owner.username) over pickup location */}

          <div className="bg-white shadow rounded-lg p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-shrink-0">
                <Image
                width={80} 
                height={80} 
                src={sanitizeImageUrl(offer.images.length > 0 ? getImage(offer.images[0].path) : DEFAULT_BAG_IMAGE)}
                alt={offer.title}
                className="h-16 rounded-md"
                loading="lazy"
                unoptimized={shouldUnoptimizeImage(offer.images.length > 0 ? getImage(offer.images[0].path) : DEFAULT_BAG_IMAGE)}
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

// Memoize component to prevent unnecessary re-renders
export default memo(OfferCarousel);
