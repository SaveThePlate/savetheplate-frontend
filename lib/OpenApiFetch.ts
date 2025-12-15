import createClient from "openapi-fetch";
import type { paths } from "@/generated/api/schema";
import { LocalStorage, SessionStorage } from "@/lib/utils";
import { useRouter } from "next/navigation";

const getaccessToken = () => {
  if (typeof window !== "undefined") {
    return SessionStorage.getItem("accessToken") || LocalStorage.getItem("accessToken");
  }
  return null;
};

// Get the base URL for API requests
// Use direct backend URL (CORS is configured on backend)
const getBaseUrl = () => {
  // Use direct backend URL for both browser and server
  return process.env.NEXT_PUBLIC_BACKEND_URL || "https://leftover-be.ccdev.space";
};

// eslint-disable-next-line import/no-anonymous-default-export
const useOpenApiFetch = () => {
  const route = useRouter();
  const accessToken = getaccessToken();
  
  const baseClient = createClient<paths>({
    baseUrl: getBaseUrl(),
    headers: {
      Authorization: accessToken ? `Bearer ${accessToken}` : "",
    },
  });

  function wrapper<T extends Function>(originalFn: T): T {
    const wrapFn = async (...args: any) => {
      try {
        const res = await originalFn(...args);
        const rawResponse = res.response;
        if (rawResponse.status === 403 || rawResponse.status === 401) {
          if (typeof window !== "undefined") {
            route.push("/signIn");
          }
        }
        if (res.error) throw res.error;

        return res;
      } catch (error: any) {
        // Handle network errors (CORS, 502, etc.)
        if (error?.message?.includes("Failed to fetch") || 
            error?.message?.includes("NetworkError") ||
            error?.message?.includes("CORS") ||
            error?.status === 502 ||
            error?.status === 503) {
          // Create a more descriptive error for network/server issues
          const networkError = new Error(
            error?.status === 502 || error?.status === 503
              ? "Server is temporarily unavailable. Please try again later."
              : "Network error. Please check your connection and try again."
          );
          (networkError as any).status = error?.status || 0;
          (networkError as any).isNetworkError = true;
          console.error("Network/Server error:", networkError.message, error);
          throw networkError;
        }
        
        console.error("API error:", error);
        throw error;
      }
    };
    return wrapFn as unknown as T;
  }

  return {
    GET: wrapper(baseClient.GET),
    POST: wrapper(baseClient.POST),
    PUT: wrapper(baseClient.PUT),
    PATCH: wrapper(baseClient.PATCH),
    DEL: wrapper(baseClient.DELETE),
  };
};

export default useOpenApiFetch;
