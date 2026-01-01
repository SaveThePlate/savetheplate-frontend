import axios from "axios";

/**
 * Centralized axios instance with token management
 * This prevents conflicts with other libraries that might set global tokens
 */
const createAxiosInstance = () => {
  // Get backend URL, defaulting to HTTPS in production
  let backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  
  // If no URL is set, use HTTPS for production
  if (!backendUrl && typeof window !== 'undefined') {
    // In browser, use current protocol to match the page
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'https:';
    backendUrl = `${protocol}//savetheplate.tn`;
  } else if (!backendUrl) {
    // Server-side default to HTTPS
    backendUrl = "https://savetheplate.tn";
  }
  
  // Ensure URL doesn't end with slash
  backendUrl = backendUrl.replace(/\/$/, "");
  
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

