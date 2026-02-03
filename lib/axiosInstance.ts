import axios, { AxiosError } from "axios";
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

  // Add retry logic with exponential backoff for rate limit errors (429)
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config;
      
      // Don't retry if no config or already retried too many times
      if (!config) {
        return Promise.reject(error);
      }

      // Track retry count in config
      const retryCount = (config as any).retryCount || 0;
      const maxRetries = 3;
      const status = error.response?.status;

      // Retry on 429 (Too Many Requests) with exponential backoff
      // Also retry on 503 (Service Unavailable) and 502 (Bad Gateway)
      const shouldRetry = [429, 502, 503].includes(status as number) && retryCount < maxRetries;

      if (shouldRetry) {
        (config as any).retryCount = retryCount + 1;
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, retryCount) * 1000;
        
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return instance(config);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Export a singleton instance
export const axiosInstance = createAxiosInstance();

// Export factory function for cases where a fresh instance is needed
export default createAxiosInstance;

