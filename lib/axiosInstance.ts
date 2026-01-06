import axios from "axios";
import { getBackendOrigin } from "@/lib/backendOrigin";

/**
 * Centralized axios instance with token management
 * This prevents conflicts with other libraries that might set global tokens
 */
const createAxiosInstance = () => {
  // Centralized backend origin logic (avoids accidental localhost in production)
  const backendUrl = getBackendOrigin();
  
  const instance = axios.create({
    baseURL: backendUrl,
    headers: { "Content-Type": "application/json" },
  });

  // Add token to each request instead of using global interceptors
  // This prevents conflicts with other libraries
  instance.interceptors.request.use((config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token && config.headers) {
      // Only set if not already set to avoid overriding
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  return instance;
};

// Export a singleton instance
export const axiosInstance = createAxiosInstance();

// Export factory function for cases where a fresh instance is needed
export default createAxiosInstance;

