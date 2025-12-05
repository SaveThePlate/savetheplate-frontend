/**
 * Universal image resolution utility
 * Handles both local public assets and backend storage URLs
 */

const DEFAULT_BAG_IMAGE = "/defaultBag.png";

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
 * - Full URLs (http/https) - return as-is
 * - Backend storage paths (/storage/...) - prepend backend URL
 * - Frontend public assets (/) - return as-is
 * - Bare filenames - assume public asset
 */
export const getImage = (filename?: string | null): string => {
  if (!filename) return DEFAULT_BAG_IMAGE;

  // Full URL from API - return as-is
  if (/^https?:\/\//i.test(filename)) {
    return filename;
  }

  // Backend storage path - prepend backend origin
  if (filename.startsWith("/storage/")) {
    const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
    return origin ? `${origin}${filename}` : filename;
  }

  // Frontend public asset (leading slash) - return as-is
  if (filename.startsWith("/")) {
    return filename;
  }

  // Bare filename - try backend storage first (most common case for uploaded images)
  // If it doesn't exist there, fallback to public folder
  const backendUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
  if (backendUrl) {
    // Try backend storage first for bare filenames (uploaded images)
    return `${backendUrl}/storage/${filename}`;
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
    // If it's a backend URL, also try as local public asset
    if (resolved.includes("/storage/")) {
      const filename = resolved.split("/").pop();
      if (filename) fallbacks.push(`/${filename}`);
    }
    // If it's a local asset, also try backend storage
    else if (resolved.startsWith("/") && !resolved.startsWith("/storage/")) {
      const filename = resolved.replace(/^\//, "");
      const origin = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/$/, "");
      if (origin && filename) fallbacks.push(`${origin}/storage/${filename}`);
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

