// Shared types for offer cards
export interface OfferOwner {
  id: number;
  username: string;
  location?: string;
  mapsLink?: string;
  profileImage?: string;
}

export interface BaseOfferCardProps {
  offerId: number;
  imageSrc?: string;
  imageAlt?: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  expirationDate?: string;
  pickupLocation: string;
  mapsLink?: string;
  owner?: OfferOwner;
}

export interface ClientOfferCardProps extends BaseOfferCardProps {
  reserveLink: string;
}

export interface ProviderOfferCardProps extends BaseOfferCardProps {
  onDelete?: (id: number) => void;
  onUpdate?: (id: number, data: any) => void;
  ownerId: number;
}

