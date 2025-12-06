// Shared utilities for offer cards
import { getImageFallbacks, resolveImageSource } from "@/utils/imageUtils";

export const DEFAULT_LOGO = "/defaultBag.png";

// Generate blur placeholder for images
export const getBlurDataURL = (color = "#eaeaea") => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'><rect width='100%' height='100%' fill='${color}'/></svg>`;
  if (typeof window === "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Format date and time for display
export const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return { date: "N/A", time: "" };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { date: "Invalid date", time: "" };
  
  const today = new Date();
  const isToday = 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
  
  return {
    date: isToday ? "Today" : date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

// Check if offer is expired
export const isOfferExpired = (expirationDate?: string): boolean => {
  if (!expirationDate) return false;
  return new Date(expirationDate).getTime() <= new Date().getTime();
};

// Calculate discount percentage
export const calculateDiscount = (price: number, originalPrice?: number): number | null => {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round((1 - price / originalPrice) * 100);
};

// Get image fallbacks for a given image source
export const getImageFallbacksForOffer = (imageSrc?: string): string[] => {
  if (!imageSrc) return [DEFAULT_LOGO];
  return getImageFallbacks(imageSrc);
};

