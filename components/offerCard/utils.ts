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
// This function is safe for SSR - uses consistent formatting
export const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return { date: "N/A", time: "" };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { date: "Invalid date", time: "" };
  
  // Use consistent date formatting that works on both server and client
  // Always use the date from the input, not "today" check to avoid hydration issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  // Format time consistently
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const formattedTime = `${hours}:${minutes}`;
  
  // Note: "Today" check should be done client-side only to avoid hydration mismatches
  // Components should check isToday separately after hydration
  return {
    date: formattedDate,
    time: formattedTime,
  };
};

// Format date and time range for display
// This function is safe for SSR - uses consistent formatting
export const formatDateTimeRange = (
  startTime?: string,
  endTime?: string,
  expirationDate?: string
) => {
  // If we have start and end times, use them
  if (startTime && endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      // Fallback to expirationDate if times are invalid
      return formatDateTime(expirationDate);
    }
    
    // Format times consistently (HH:MM format)
    const startHours = String(start.getHours()).padStart(2, '0');
    const startMinutes = String(start.getMinutes()).padStart(2, '0');
    const startTimeStr = `${startHours}:${startMinutes}`;
    
    const endHours = String(end.getHours()).padStart(2, '0');
    const endMinutes = String(end.getMinutes()).padStart(2, '0');
    const endTimeStr = `${endHours}:${endMinutes}`;
    
    // Format date consistently
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const day = String(start.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    // Note: "Today" check should be done client-side only to avoid hydration mismatches
    // Components should check isToday separately after hydration
    return {
      date: formattedDate,
      time: `${startTimeStr} - ${endTimeStr}`,
      startTime: startTimeStr,
      endTime: endTimeStr,
    };
  }
  
  // Fallback to expirationDate for backward compatibility
  return formatDateTime(expirationDate);
};

// Helper function to check if a date is today (client-side only)
export const isDateToday = (dateString: string | undefined): boolean => {
  if (!dateString) return false;
  if (typeof window === 'undefined') return false; // Always false on server to avoid hydration issues
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;
  
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
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

