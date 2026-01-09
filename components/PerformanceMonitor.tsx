"use client";

import { useEffect } from 'react';
import { measureWebVitals } from '@/lib/performance';

/**
 * Component to initialize performance monitoring
 * Should be placed in the root layout
 */
export function PerformanceMonitor() {
  useEffect(() => {
    // Only measure in production or when explicitly enabled
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true') {
      measureWebVitals();
    }
  }, []);

  return null; // This component doesn't render anything
}

