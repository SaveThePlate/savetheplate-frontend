/**
 * Utility functions for handling and sanitizing error messages
 */

/**
 * Checks if an error message contains technical details that shouldn't be shown to users
 */
export function isTechnicalError(message: string): boolean {
  if (!message) return false;
  
  const technicalIndicators = [
    'Error:',
    'Exception:',
    'at ',
    'Stack trace',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    'NetworkError',
    'CORS',
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'socket',
    'connection',
    'timeout',
    'ECONNRESET',
    'EADDRINUSE',
    'Failed to fetch', // Too generic
    'Network request failed',
    'Unexpected token',
    'JSON.parse',
    'undefined is not',
    'Cannot read property',
    'is not a function',
    'Maximum call stack',
  ];
  
  const lowerMessage = message.toLowerCase();
  return technicalIndicators.some(indicator => 
    lowerMessage.includes(indicator.toLowerCase())
  );
}

/**
 * Sanitizes an error message to make it user-friendly
 * Removes technical details and provides context-aware messages
 */
export function sanitizeErrorMessage(
  error: any,
  context: {
    action?: string; // e.g., "fetch offers", "update profile", "create offer"
    defaultMessage?: string;
  } = {}
): string {
  const { action = "perform this action", defaultMessage } = context;
  
  // Check for specific HTTP status codes
  if (error?.response?.status) {
    const status = error.response.status;
    
    switch (status) {
      case 400:
        return `Invalid request. Please check your input and try again.`;
      case 401:
        return `Your session has expired. Please sign in again.`;
      case 403:
        return `You don't have permission to ${action}.`;
      case 404:
        // Try to get more specific error message from backend
        if (error?.response?.data?.message) {
          const backendMsg = error.response.data.message;
          if (backendMsg.includes('Order') || backendMsg.includes('Offer') || backendMsg.includes('Rating')) {
            return backendMsg;
          }
        }
        return `The requested item was not found.`;
      case 409:
        return `This action conflicts with current data. Please refresh and try again.`;
      case 422:
        return `Invalid data provided. Please check your input.`;
      case 429:
        return `Too many requests. Please wait a moment and try again.`;
      case 500:
        return `Server error. Please try again in a moment.`;
      case 502:
      case 503:
        return `Server is temporarily unavailable. Please try again later.`;
      case 504:
        return `Request timed out. Please try again.`;
    }
  }
  
  // Check for network errors
  if (error?.isNetworkError || 
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("NetworkError") ||
      error?.message?.includes("Network request failed")) {
    return `Unable to connect to the server. Please check your internet connection and try again.`;
  }
  
  // Check for CORS errors
  if (error?.message?.includes("CORS") || 
      error?.message?.includes("Access-Control")) {
    return `Connection error. Please try again later.`;
  }
  
  // Try to extract user-friendly message from backend
  let backendMessage: string | null = null;
  
  if (error?.response?.data?.message) {
    backendMessage = error.response.data.message;
  } else if (error?.response?.data?.error) {
    backendMessage = error.response.data.error;
  } else if (error?.data?.message) {
    backendMessage = error.data.message;
  } else if (error?.message) {
    backendMessage = error.message;
  }
  
  // If we have a backend message, check if it's user-friendly
  if (backendMessage) {
    // Filter out technical errors
    if (!isTechnicalError(backendMessage)) {
      // Check if message is already user-friendly (not too long, no technical terms)
      if (backendMessage.length < 200 && 
          !backendMessage.includes('Error') &&
          !backendMessage.includes('Exception') &&
          !backendMessage.includes('at ')) {
        return backendMessage;
      }
    }
  }
  
  // Return default message based on context
  if (defaultMessage) {
    return defaultMessage;
  }
  
  // Generic fallback based on action
  return `Unable to ${action}. Please try again later.`;
}

/**
 * Gets a user-friendly error message for specific actions
 */
export function getActionErrorMessage(
  action: 'fetch' | 'create' | 'update' | 'delete' | 'upload' | 'order' | 'cancel',
  resource: string
): string {
  const actionMap = {
    fetch: `Unable to load ${resource}. Please try again later.`,
    create: `Unable to create ${resource}. Please check your input and try again.`,
    update: `Unable to update ${resource}. Please try again.`,
    delete: `Unable to delete ${resource}. Please try again.`,
    upload: `Unable to upload ${resource}. Please check the file and try again.`,
    order: `Unable to place order. Please try again.`,
    cancel: `Unable to cancel. Please try again.`,
  };
  
  return actionMap[action];
}

