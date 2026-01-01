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
    t?: (key: string, params?: Record<string, string>) => string; // Translation function
  } = {}
): string {
  const { action = "perform this action", defaultMessage, t } = context;
  
  // Helper function to get translated message with fallback
  const getTranslated = (key: string, params?: Record<string, string>, fallback?: string): string => {
    if (t) {
      try {
        const translated = t(key, params);
        // If translation returns the key itself (no translation found), use fallback
        if (translated === key && fallback) {
          return fallback;
        }
        return translated;
      } catch {
        return fallback || key;
      }
    }
    return fallback || key;
  };
  
  // Check for specific HTTP status codes
  if (error?.response?.status) {
    const status = error.response.status;
    
    // Check if this is an authentication-related action
    const isAuthAction = action?.toLowerCase().includes('sign in') || 
                         action?.toLowerCase().includes('sign in') ||
                         action?.toLowerCase().includes('sign up') ||
                         action?.toLowerCase().includes('login') ||
                         action?.toLowerCase().includes('authenticate');
    
    switch (status) {
      case 400:
        // For auth actions, provide more specific message
        if (isAuthAction) {
          return getTranslated('signin.error_invalid_credentials', undefined, 'Invalid email or password. Please check your credentials and try again.');
        }
        return getTranslated('errors.invalid_request', undefined, 'Invalid request. Please check your input and try again.');
      case 401:
        // For auth actions, provide more specific message
        if (isAuthAction) {
          return getTranslated('signin.error_invalid_credentials', undefined, 'Invalid email or password. Please check your credentials and try again.');
        }
        return getTranslated('errors.session_expired', undefined, 'Your session has expired. Please sign in again.');
      case 403:
        return getTranslated('errors.no_permission', { action }, `You don't have permission to ${action}.`);
      case 404:
        // For auth endpoints, 404 means endpoint doesn't exist or user not found
        // Check if this is an auth-related request
        const url = error?.config?.url || error?.request?.responseURL || '';
        if (url.includes('/auth/') || isAuthAction) {
          return getTranslated('signin.error_invalid_credentials', undefined, 'Invalid email or password. Please check your credentials and try again.');
        }
        // Try to get more specific error message from backend
        if (error?.response?.data?.message) {
          const backendMsg = error.response.data.message;
          if (backendMsg.includes('Order') || backendMsg.includes('Offer') || backendMsg.includes('Rating')) {
            return backendMsg;
          }
        }
        return getTranslated('errors.item_not_found', undefined, 'The requested item was not found.');
      case 409:
        return getTranslated('errors.conflict', undefined, 'This action conflicts with current data. Please refresh and try again.');
      case 422:
        if (isAuthAction) {
          return getTranslated('signin.error_invalid_credentials', undefined, 'Invalid email or password. Please check your credentials and try again.');
        }
        return getTranslated('errors.invalid_data', undefined, 'Invalid data provided. Please check your input.');
      case 429:
        return getTranslated('errors.too_many_requests', undefined, 'Too many requests. Please wait a moment and try again.');
      case 500:
        return getTranslated('errors.server_error', undefined, 'Server error. Please try again in a moment.');
      case 502:
      case 503:
        return getTranslated('errors.server_unavailable', undefined, 'Server is temporarily unavailable. Please try again later.');
      case 504:
        return getTranslated('errors.request_timeout', undefined, 'Request timed out. Please try again.');
    }
  }
  
  // Check for network errors
  if (error?.isNetworkError || 
      error?.message?.includes("Failed to fetch") ||
      error?.message?.includes("NetworkError") ||
      error?.message?.includes("Network request failed")) {
    return getTranslated('errors.network_error', undefined, 'Unable to connect to the server. Please check your internet connection and try again.');
  }
  
  // Check for CORS errors
  if (error?.message?.includes("CORS") || 
      error?.message?.includes("Access-Control")) {
    return getTranslated('errors.connection_error', undefined, 'Connection error. Please try again later.');
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
  return getTranslated('errors.unable_to_action', { action }, `Unable to ${action}. Please try again later.`);
}

/**
 * Gets a user-friendly error message for specific actions
 */
export function getActionErrorMessage(
  action: 'fetch' | 'create' | 'update' | 'delete' | 'upload' | 'order' | 'cancel',
  resource: string,
  t?: (key: string, params?: Record<string, string>) => string
): string {
  // Helper function to get translated message with fallback
  const getTranslated = (key: string, params?: Record<string, string>, fallback?: string): string => {
    if (t) {
      try {
        const translated = t(key, params);
        if (translated === key && fallback) {
          return fallback;
        }
        return translated;
      } catch {
        return fallback || key;
      }
    }
    return fallback || key;
  };
  
  const actionMap = {
    fetch: getTranslated('errors.unable_to_load', { resource }, `Unable to load ${resource}. Please try again later.`),
    create: getTranslated('errors.unable_to_create', { resource }, `Unable to create ${resource}. Please check your input and try again.`),
    update: getTranslated('errors.unable_to_update', { resource }, `Unable to update ${resource}. Please try again.`),
    delete: getTranslated('errors.unable_to_delete', { resource }, `Unable to delete ${resource}. Please try again.`),
    upload: getTranslated('errors.unable_to_upload', { resource }, `Unable to upload ${resource}. Please check the file and try again.`),
    order: getTranslated('errors.unable_to_order', undefined, 'Unable to place order. Please try again.'),
    cancel: getTranslated('errors.unable_to_cancel', undefined, 'Unable to cancel. Please try again.'),
  };
  
  return actionMap[action];
}

