import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { getBackendOrigin } from "@/lib/backendOrigin";

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Generate cache key from request config
function getCacheKey(config: AxiosRequestConfig): string {
  const { method = 'get', url = '', params = {} } = config;
  return `${method.toLowerCase()}:${url}:${JSON.stringify(params)}`;
}

/**
 * Centralized axios instance with token management, retry logic, and request deduplication
 */
const createAxiosInstance = () => {
  // Centralized backend origin logic (avoids accidental localhost in production)
  const backendUrl = getBackendOrigin();
  
  const instance = axios.create({
    baseURL: backendUrl,
    headers: { "Content-Type": "application/json" },
  });

  // Add token to each request
  instance.interceptors.request.use((config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token && config.headers) {
      if (!config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Request deduplication for GET requests
    if (config.method?.toLowerCase() === 'get' && !(config as any).skipDedup) {
      const cacheKey = getCacheKey(config);
      const pendingRequest = pendingRequests.get(cacheKey);
      
      if (pendingRequest) {
        // Return the existing pending request
        return Promise.reject({
          __DEDUPED__: true,
          promise: pendingRequest,
        });
      }
    }

    return config;
  });

  // Add retry logic with exponential backoff and request deduplication
  instance.interceptors.response.use(
    (response) => {
      // Clear pending request from deduplication cache
      if (response.config.method?.toLowerCase() === 'get') {
        const cacheKey = getCacheKey(response.config);
        pendingRequests.delete(cacheKey);
      }
      return response;
    },
    async (error: any) => {
      // Handle deduplicated requests
      if (error.__DEDUPED__) {
        return error.promise;
      }

      const config = error.config;
      
      // Clear pending request from deduplication cache on error
      if (config?.method?.toLowerCase() === 'get') {
        const cacheKey = getCacheKey(config);
        pendingRequests.delete(cacheKey);
      }

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
        
        // Store the retry promise for deduplication
        if (config.method?.toLowerCase() === 'get') {
          const cacheKey = getCacheKey(config);
          const retryPromise = new Promise((resolve) => setTimeout(resolve, delayMs))
            .then(() => instance(config));
          pendingRequests.set(cacheKey, retryPromise);
          return retryPromise;
        }
        
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