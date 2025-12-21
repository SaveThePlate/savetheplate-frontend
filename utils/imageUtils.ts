/**
 * Universal image resolution utility
 * Handles both local public assets and backend storage URLs
 */

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

/**
 * Validates and sanitizes an image URL to ensure it's safe for Next.js Image component
 */
export const sanitizeImageUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') {
    return DEFAULT_BAG_IMAGE;
  }
  
  // Blob URLs and data URLs are valid
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  
  // Relative paths starting with / are valid
  if (url.startsWith('/')) {
    return url;
  }
  
  // Full URLs need to be validated
  if (/^https?:\/\//i.test(url)) {
    try {
      new URL(url);
      return url;
    } catch {
      return DEFAULT_BAG_IMAGE;
    }
  }
  
  // If it's not a valid format, return default
  return DEFAULT_BAG_IMAGE;
};

/**
 * Checks if an image URL should use unoptimized prop
 * Returns true for localhost, external backend URLs, or any non-public asset
 */
export const shouldUnoptimizeImage = (url: string | null | undefined): boolean => {
  // Handle invalid/empty URLs - default to unoptimized to be safe
  if (!url || typeof url !== 'string') {
    return true; // Changed to true to avoid optimization attempts on invalid URLs
  }
  
  // Blob URLs (from URL.createObjectURL) should always be unoptimized
  if (url.startsWith('blob:')) {
    return true;
  }
  
  // Data URLs should be unoptimized
  if (url.startsWith('data:')) {
    return true;
  }
  
  // All backend storage images should be unoptimized to avoid upstream fetch issues
  // Check this FIRST before other checks to ensure we catch all storage URLs
  if (url.includes('/storage/')) {
    return true;
  }
  
  // Public assets (starting with / and not /storage/) can be optimized
  if (url.startsWith('/') && !url.startsWith('/storage/')) {
    return false;
  }
  
      // Check if it's a full URL (external image)
      if (/^https?:\/\//i.test(url)) {
        try {
          const urlObj = new URL(url);
          // Localhost images should be unoptimized
          if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
            return true;
          }
          // Facebook CDN images should be unoptimized (they often have CORS restrictions)
          if (urlObj.hostname.includes('fbcdn.net') || urlObj.hostname.includes('facebook.com')) {
            return true;
          }
          // Check if it's from the backend domain (more robust check)
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
          if (backendUrl) {
            try {
              const backendUrlObj = new URL(backendUrl);
              // Check if hostname matches (handles both with and without www)
              if (urlObj.hostname === backendUrlObj.hostname || 
                  urlObj.hostname.replace(/^www\./, '') === backendUrlObj.hostname.replace(/^www\./, '')) {
                return true;
              }
            } catch {
              // Fallback: check if URL contains backend hostname
              const backendHost = backendUrl.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
              if (urlObj.hostname === backendHost || url.includes(backendHost)) {
                return true;
              }
            }
          }
          // All other external URLs should be unoptimized to avoid CORS/fetch issues
          return true;
    } catch {
      // If URL parsing fails, assume it should be unoptimized
      return true;
    }
  }
  
  // Default: unoptimize to be safe
  return true;
};

/**
 * @deprecated Use shouldUnoptimizeImage instead
 * Checks if an image URL is from localhost (needs unoptimized prop)
 */
export const isLocalhostImage = (url: string): boolean => {
  return shouldUnoptimizeImage(url);
};

export interface ImageSource {
  original?: { url?: string };
  url?: string;
  absoluteUrl?: string;
  filename?: string;
  path?: string;
}

/**
 * Resolves an image source to a usable URL
 * Priority: original?.url (frontend public) > absoluteUrl (backend) > url > filename
 */
export const resolveImageSource = (imageSource: ImageSource | string | null | undefined): string => {
  if (!imageSource) return DEFAULT_BAG_IMAGE;

  // If it's already a string, use getImage to resolve it
  if (typeof imageSource === "string") {
    return getImage(imageSource);
  }

  // Priority order: original?.url > absoluteUrl > url > filename > path
  const candidate =
    imageSource.original?.url ||
    imageSource.absoluteUrl ||
    imageSource.url ||
    imageSource.filename ||
    imageSource.path;

  return candidate ? getImage(candidate) : DEFAULT_BAG_IMAGE;
};

/**
 * Resolves a filename/URL to a usable image path
 * Handles:
 * - Full URLs (http/https) - normalize to current environment's backend URL
 * - Backend storage paths (/storage/...) - prepend current backend URL
 * - Frontend public assets (/) - return as-is
 * - Bare filenames - use current backend storage
 */
export const getImage = (filename?: string | null): string => {
  if (!filename) return DEFAULT_BAG_IMAGE;

  const currentBackendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");

  // Full URL from API - check if it's from a different backend
  if (/^https?:\/\//i.test(filename)) {
    try {
      const urlObj = new URL(filename);
      const urlHost = urlObj.hostname;
      
      // Fix malformed storage domains (e.g., leftover-be.ccdev.spacestorage -> leftover-be.ccdev.space)
      if (urlHost.includes('.spacestorage')) {
        const correctedHost = urlHost.replace('.spacestorage', '.space');
        const pathname = urlObj.pathname;
        
        // If pathname already has /storage/, just fix the host
        if (pathname && pathname.startsWith('/storage/')) {
          return `https://${correctedHost}${pathname}`;
        }
        
        // Extract filename from pathname (handles both /filename.png and /storage/filename.png)
        const pathParts = pathname ? pathname.split('/').filter(p => p) : [];
        if (pathParts.length > 0) {
          const filenameFromPath = pathParts[pathParts.length - 1];
          // Ensure /storage/ prefix is added
          return `https://${correctedHost}/storage/${filenameFromPath}`;
        }
        
        // If we can't extract filename, fall back to default image
        return DEFAULT_BAG_IMAGE;
      }
      
      // Extract the current backend hostname
      let currentBackendHost = "";
      if (currentBackendUrl) {
        try {
          const currentBackendUrlObj = new URL(currentBackendUrl);
          currentBackendHost = currentBackendUrlObj.hostname;
        } catch {
          // If current backend URL is invalid, extract hostname manually
          const match = currentBackendUrl.match(/https?:\/\/([^\/]+)/);
          if (match) currentBackendHost = match[1];
        }
      }
      
      // If the URL is from a different backend (production vs localhost), keep it as-is
      // This allows production images to load on localhost and vice versa
      if (currentBackendHost && urlHost !== currentBackendHost && urlHost !== 'localhost' && urlHost !== '127.0.0.1') {
        // Different backend - keep original URL to access images from that backend
        return filename;
      }
      
      // Same backend or localhost - normalize to current backend URL
      const urlMatch = filename.match(/\/(storage\/.+)$/);
      if (urlMatch && currentBackendUrl) {
        return `${currentBackendUrl}${urlMatch[1]}`;
      }
      
      // If URL doesn't have /storage/ but is from the backend, try to extract filename
      if (currentBackendHost && urlHost === currentBackendHost) {
        const pathname = urlObj.pathname;
        if (pathname && !pathname.startsWith('/storage/')) {
          // Extract filename and add /storage/ prefix
          const filenameFromPath = pathname.split('/').pop();
          if (filenameFromPath) {
            return `${currentBackendUrl}/storage/${filenameFromPath}`;
          }
        }
      }
    } catch {
      // If URL parsing fails, try to extract storage path anyway
      // Also check for malformed .spacestorage domain
      if (filename.includes('.spacestorage')) {
        const corrected = filename.replace('.spacestorage', '.space');
        const urlMatch = corrected.match(/\/(storage\/.+)$/);
        if (urlMatch && currentBackendUrl) {
          return `${currentBackendUrl}${urlMatch[1]}`;
        }
        // Try to extract filename from the corrected URL
        const filenameMatch = corrected.match(/\/([^\/]+\.(png|jpg|jpeg|gif|webp|svg))$/i);
        if (filenameMatch && currentBackendUrl) {
          return `${currentBackendUrl}/storage/${filenameMatch[1]}`;
        }
      }
      const urlMatch = filename.match(/\/(storage\/.+)$/);
      if (urlMatch && currentBackendUrl) {
        return `${currentBackendUrl}${urlMatch[1]}`;
      }
    }
    // If we can't extract storage path, return as-is
    return filename;
  }

  // Backend storage path - prepend current backend origin
  if (filename.startsWith("/storage/")) {
    return currentBackendUrl ? `${currentBackendUrl}${filename}` : filename;
  }

  // Frontend public asset (leading slash, not /storage/) - return as-is
  if (filename.startsWith("/")) {
    return filename;
  }

  // Bare filename - use current backend storage
  if (currentBackendUrl) {
    return `${currentBackendUrl}/storage/${filename}`;
  }
  
  // Fallback to public folder if no backend URL
  return `/${filename}`;
};

/**
 * Gets all possible image URLs for fallback purposes
 * Returns array of URLs to try in order
 */
export const getImageFallbacks = (imageSource: ImageSource | string | null | undefined): string[] => {
  const fallbacks: string[] = [];

  if (!imageSource) {
    return [DEFAULT_BAG_IMAGE];
  }

  if (typeof imageSource === "string") {
    const resolved = getImage(imageSource);
    fallbacks.push(resolved);
    
    // Extract filename for fallback attempts
    let extractedFilename: string | null = null;
    
    // Try to extract filename from various URL formats
    if (resolved.includes("/storage/")) {
      extractedFilename = resolved.split("/storage/").pop() || null;
    } else if (imageSource.includes("/storage/")) {
      extractedFilename = imageSource.split("/storage/").pop() || null;
    } else if (!imageSource.startsWith("/") && !/^https?:\/\//i.test(imageSource)) {
      extractedFilename = imageSource;
    }
    
    // If we extracted a filename, try alternative URLs
    if (extractedFilename) {
      const currentBackendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      // Try current backend storage
      if (currentBackendUrl) {
        fallbacks.push(`${currentBackendUrl}/storage/${extractedFilename}`);
      }
      // Try as public asset
      fallbacks.push(`/${extractedFilename}`);
    }
    
    fallbacks.push(DEFAULT_BAG_IMAGE);
    return fallbacks;
  }

  // Try original?.url first (frontend public asset)
  if (imageSource.original?.url) {
    fallbacks.push(getImage(imageSource.original.url));
  }

  // Try absoluteUrl (backend storage)
  if (imageSource.absoluteUrl) {
    fallbacks.push(getImage(imageSource.absoluteUrl));
  }

  // Try url
  if (imageSource.url) {
    fallbacks.push(getImage(imageSource.url));
  }

  // Try filename as public asset
  if (imageSource.filename) {
    fallbacks.push(getImage(imageSource.filename));
    // Also try as backend storage
    const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
    if (origin) {
      fallbacks.push(`${origin}/storage/${imageSource.filename}`);
    }
  }

  // Try path
  if (imageSource.path) {
    fallbacks.push(getImage(imageSource.path));
  }

  // Always end with default
  fallbacks.push(DEFAULT_BAG_IMAGE);

  // Remove duplicates while preserving order
  return Array.from(new Set(fallbacks));
};

