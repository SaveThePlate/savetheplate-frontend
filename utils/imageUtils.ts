/**
 * Universal image resolution utility
 * Handles both local public assets and backend storage URLs
 */

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

/**
 * Checks if an image URL should use unoptimized prop
 * Returns true for localhost, external backend URLs, or any non-public asset
 */
export const shouldUnoptimizeImage = (url: string): boolean => {
  if (!url) return false;
  
  // Public assets (starting with / and not /storage/) can be optimized
  if (url.startsWith('/') && !url.startsWith('/storage/')) {
    return false;
  }
  
  // All backend storage images should be unoptimized to avoid upstream fetch issues
  if (url.includes('/storage/')) {
    return true;
  }
  
  // Check if it's a full URL (external image)
  if (/^https?:\/\//i.test(url)) {
    try {
      const urlObj = new URL(url);
      // Localhost images should be unoptimized
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        return true;
      }
      // External backend URLs should be unoptimized to avoid CORS/fetch issues
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      if (backendUrl && url.includes(backendUrl.replace(/^https?:\/\//, '').split('/')[0])) {
        return true;
      }
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

  // Full URL from API - normalize to current environment
  if (/^https?:\/\//i.test(filename)) {
    // Extract storage path from URL (e.g., /storage/filename.jpg from https://domain.com/storage/filename.jpg)
    // Handle both single and nested paths: /storage/file.jpg or /storage/subfolder/file.jpg
    const urlMatch = filename.match(/\/(storage\/.+)$/);
    if (urlMatch && currentBackendUrl) {
      // Reconstruct using current backend URL to handle cross-environment scenarios
      // This ensures images uploaded on production work on localhost and vice versa
      return `${currentBackendUrl}${urlMatch[1]}`;
    }
    // If we can't extract storage path, return as-is (might be external image or different format)
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

