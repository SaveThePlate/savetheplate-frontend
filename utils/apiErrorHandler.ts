import { toast } from "react-toastify";

/**
 * Centralized error handler for API calls
 * Provides consistent error messaging across the application
 */

export interface ApiError {
  response?: {
    data?: {
      message?: string;
      error?: string;
      statusCode?: number;
    };
    status?: number;
  };
  message?: string;
}

/**
 * Extract a user-friendly error message from an API error
 */
export const getErrorMessage = (error: any, fallbackMessage: string): string => {
  // Handle axios error structure
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Try message first (most common)
    if (data.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(', ');
      }
      return data.message;
    }
    
    // Try error field
    if (data.error) {
      return data.error;
    }
  }
  
  // Try direct message property
  if (error?.message) {
    return error.message;
  }
  
  // Return fallback
  return fallbackMessage;
};

/**
 * Handle API error with toast notification
 * @param error - The error object from the API call
 * @param fallbackMessage - Message to show if no specific error message is found
 * @returns The error message that was displayed
 */
export const handleApiError = (
  error: any,
  fallbackMessage: string = "An error occurred. Please try again."
): string => {
  const errorMessage = getErrorMessage(error, fallbackMessage);
  
  toast.error(errorMessage, {
    position: "top-center",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
  
  // Log error for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      message: errorMessage,
      status: error?.response?.status,
      data: error?.response?.data,
      fullError: error,
    });
  }
  
  return errorMessage;
};

/**
 * Handle API success with toast notification
 */
export const handleApiSuccess = (
  message: string,
  options?: {
    duration?: number;
    position?: "top-center" | "top-right" | "top-left" | "bottom-center" | "bottom-right" | "bottom-left";
  }
): void => {
  toast.success(message, {
    position: options?.position || "top-center",
    autoClose: options?.duration || 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

/**
 * Check if error is due to authentication failure
 */
export const isAuthError = (error: any): boolean => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

/**
 * Check if error is due to network issues
 */
export const isNetworkError = (error: any): boolean => {
  return !error?.response && error?.message?.toLowerCase().includes('network');
};

/**
 * Get HTTP status code from error
 */
export const getStatusCode = (error: any): number | undefined => {
  return error?.response?.status || error?.response?.data?.statusCode;
};

/**
 * Handle authentication errors with redirect
 */
export const handleAuthError = (
  error: any,
  router: any,
  redirectPath: string = "/signIn"
): void => {
  if (isAuthError(error)) {
    handleApiError(error, "Your session has expired. Please sign in again.");
    
    // Clear tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    
    // Redirect to sign in
    setTimeout(() => {
      router.push(redirectPath);
    }, 1500);
  } else {
    handleApiError(error, "An error occurred. Please try again.");
  }
};

