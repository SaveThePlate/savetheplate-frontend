import createClient from "openapi-fetch";
import type { paths } from "@/generated/api/schema";
import { LocalStorage, SessionStorage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { getBackendOrigin } from "@/lib/backendOrigin";

const getaccessToken = () => {
  if (typeof window !== "undefined") {
    return SessionStorage.getItem("accessToken") || LocalStorage.getItem("accessToken");
  }
  return null;
};

// Get the base URL for API requests (avoids accidental localhost in production)
const getBaseUrl = () => getBackendOrigin();

// eslint-disable-next-line import/no-anonymous-default-export
const useOpenApiFetch = () => {
  const route = useRouter();
  
  // Create client without any global configuration to avoid token conflicts
  // We'll pass the token in each request individually
  // Note: We explicitly don't set TOKEN or HEADERS in createClient to avoid
  // the "overriding current access token" warning from openapi-fetch
  const baseClient = createClient<paths>({
    baseUrl: getBaseUrl(),
    // Don't set headers here - pass them per request to avoid global conflicts
    // This prevents the "overriding current access token" warning
  });

  function wrapper<T extends Function>(originalFn: T): T {
    const wrapFn = async (...args: any) => {
      try {
        // Get fresh token for each request to avoid stale tokens
        const accessToken = getaccessToken();
        
        // openapi-fetch passes options as second argument: (path, { body, params, headers, ... })
        // Create a new options object to avoid mutating the original
        if (args.length >= 2 && typeof args[1] === 'object') {
          const originalOptions = args[1];
          // Create a new options object with headers
          args[1] = {
            ...originalOptions,
            headers: {
              ...originalOptions.headers,
              // Only add Authorization if token exists and not already set
              ...(accessToken && !originalOptions.headers?.Authorization ? {
                Authorization: `Bearer ${accessToken}`
              } : {}),
            },
          };
        } else if (args.length === 1 && accessToken) {
          // If only path is provided, add options with headers
          args.push({
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
        }
        
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
