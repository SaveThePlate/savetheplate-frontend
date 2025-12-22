/**
 * Custom hook to manage blob URLs created with URL.createObjectURL()
 * Automatically revokes blob URLs when they're no longer needed or component unmounts
 */

import { useRef, useEffect, useCallback } from 'react';

export function useBlobUrl() {
  const blobUrlsRef = useRef<Set<string>>(new Set());

  // Revoke a specific blob URL
  const revokeBlobUrl = useCallback((url: string | null | undefined) => {
    if (url && url.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(url);
        blobUrlsRef.current.delete(url);
      } catch (error) {
        console.warn('Error revoking blob URL:', error);
      }
    }
  }, []);

  // Create a blob URL and track it
  const createBlobUrl = useCallback((file: File | null | undefined): string | null => {
    if (!file) return null;
    
    try {
      const blobUrl = URL.createObjectURL(file);
      blobUrlsRef.current.add(blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('Error creating blob URL:', error);
      return null;
    }
  }, []);

  // Revoke all tracked blob URLs
  const revokeAll = useCallback(() => {
    blobUrlsRef.current.forEach((url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Error revoking blob URL:', error);
      }
    });
    blobUrlsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      revokeAll();
    };
  }, [revokeAll]);

  return {
    createBlobUrl,
    revokeBlobUrl,
    revokeAll,
  };
}

