/**
 * Performance monitoring utilities
 * Tracks key web vitals and custom metrics
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

// Web Vitals thresholds (in milliseconds)
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 },  // First Contentful Paint
  LCP: { good: 2500, poor: 4000 },  // Largest Contentful Paint
  FID: { good: 100, poor: 300 },    // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },   // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 },  // Time to First Byte
  INP: { good: 200, poor: 500 },    // Interaction to Next Paint
};

function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report performance metric to analytics
 */
function reportMetric(metric: PerformanceMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      timestamp: new Date(metric.timestamp).toISOString(),
    });
  }

  // Send to analytics in production
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_value: metric.value,
    });
  }
}

/**
 * Measure and report Web Vitals
 */
export function measureWebVitals() {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const value = lastEntry.renderTime || lastEntry.loadTime;
      
      reportMetric({
        name: 'LCP',
        value,
        rating: getRating(value, THRESHOLDS.LCP),
        timestamp: Date.now(),
      });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const value = entry.processingStart - entry.startTime;
        
        reportMetric({
          name: 'FID',
          value,
          rating: getRating(value, THRESHOLDS.FID),
          timestamp: Date.now(),
        });
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (e) {
    // FID not supported
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      reportMetric({
        name: 'CLS',
        value: clsValue,
        rating: getRating(clsValue, THRESHOLDS.CLS),
        timestamp: Date.now(),
      });
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (e) {
    // CLS not supported
  }

  // Time to First Byte (TTFB)
  try {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const value = navigationEntry.responseStart - navigationEntry.requestStart;
      
      reportMetric({
        name: 'TTFB',
        value,
        rating: getRating(value, THRESHOLDS.TTFB),
        timestamp: Date.now(),
      });
    }
  } catch (e) {
    // TTFB not supported
  }

  // First Contentful Paint (FCP)
  try {
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        reportMetric({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating(entry.startTime, THRESHOLDS.FCP),
          timestamp: Date.now(),
        });
      });
    });
    fcpObserver.observe({ type: 'paint', buffered: true });
  } catch (e) {
    // FCP not supported
  }
}

/**
 * Measure custom timing
 */
export function measureCustomTiming(name: string, startMark: string, endMark?: string) {
  if (typeof window === 'undefined' || !performance.mark) {
    return;
  }

  try {
    if (!endMark) {
      performance.mark(startMark);
      return;
    }

    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    
    const measure = performance.getEntriesByName(name)[0];
    if (measure) {
      reportMetric({
        name: `custom_${name}`,
        value: measure.duration,
        rating: measure.duration < 1000 ? 'good' : measure.duration < 3000 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
      });
    }

    // Clean up marks and measures
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(name);
  } catch (e) {
    console.warn('Error measuring custom timing:', e);
  }
}

/**
 * Monitor API request performance
 */
export function measureApiRequest(url: string, duration: number, status: number) {
  const metric: PerformanceMetric = {
    name: 'api_request',
    value: duration,
    rating: duration < 500 ? 'good' : duration < 1500 ? 'needs-improvement' : 'poor',
    timestamp: Date.now(),
  };

  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Performance] ${url}:`, {
      duration: `${duration}ms`,
      status,
      rating: metric.rating,
    });
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'api_request', {
      url,
      duration: Math.round(duration),
      status,
      rating: metric.rating,
    });
  }
}

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

