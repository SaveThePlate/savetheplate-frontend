import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axiosInstance';

interface Offer {
  id: number;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  expirationDate: string;
  pickupStartTime?: string;
  pickupEndTime?: string;
  pickupLocation: string;
  latitude?: number;
  longitude?: number;
  mapsLink?: string;
  foodType?: "snack" | "meal" | "beverage" | "other";
  taste?: "sweet" | "salty" | "both" | "neutral";
  images?: { filename: string; alt?: string; url?: string; absoluteUrl?: string }[];
  owner?: {
    id: number;
    username: string;
    location?: string;
    phoneNumber?: number;
    mapsLink?: string;
    profileImage?: string;
    latitude?: number;
    longitude?: number;
  };
  averageRating?: number;
  totalRatings?: number;
  distance?: number;
}

interface OffersResponse {
  data: Offer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const useOffers = (page: number = 1, limit: number = 50) => {
  return useQuery<OffersResponse>({
    queryKey: ['offers', page, limit],
    queryFn: async () => {
      const response = await axiosInstance.get(`/offers?page=${page}&limit=${limit}`);
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // Data is fresh for 2 minutes
    gcTime: 1000 * 60 * 10, // Cache persists for 10 minutes
  });
};

export const useOffersByOwner = (ownerId: number) => {
  return useQuery<Offer[]>({
    queryKey: ['offers', 'owner', ownerId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/offers/owner/${ownerId}`);
      return response.data;
    },
    enabled: !!ownerId, // Only run query if ownerId is provided
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
};

export const useOffer = (offerId: number) => {
  return useQuery<Offer>({
    queryKey: ['offer', offerId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/offers/${offerId}`);
      return response.data;
    },
    enabled: !!offerId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
};

