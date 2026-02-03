/**
 * Loading optimization strategies for better UX
 * Prevents empty pages and improves perceived performance
 */

import React, { ReactNode } from "react";

/**
 * Strategy 1: Suspense Boundary for Async Components
 * Automatically shows fallback UI while component loads
 */
export const SuspenseBoundary = ({ 
  children, 
  fallback,
  name = "Loading..."
}: { 
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}) => {
  return (
    <React.Suspense fallback={fallback || <div className="p-4">{name}</div>}>
      {children}
    </React.Suspense>
  );
};

/**
 * Strategy 2: Loading Container
 * Shows skeleton while loading, content when ready
 * Prevents layout shift with fixed dimensions
 */
interface LoadingContainerProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  minHeight?: string;
}

export const LoadingContainer = ({
  isLoading,
  skeleton,
  children,
  minHeight = "200px"
}: LoadingContainerProps) => {
  if (isLoading) {
    return <div style={{ minHeight }}>{skeleton}</div>;
  }
  return <>{children}</>;
};

/**
 * Strategy 3: Stale-While-Revalidate
 * Shows old data while loading new data
 * Much better UX than showing empty/loading state
 */
interface StaleDataProps<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  children: (data: T) => ReactNode;
  skeleton: ReactNode;
  fallback?: ReactNode;
  isStale?: boolean;
}

export const StaleWhileRevalidate = <T,>({
  data,
  isLoading,
  error,
  children,
  skeleton,
  fallback,
  isStale = false
}: StaleDataProps<T>) => {
  // If we have data (even stale), show it
  if (data) {
    return (
      <div className={isLoading && isStale ? "opacity-75" : ""}>
        {children(data)}
      </div>
    );
  }

  // Loading with no data - show skeleton
  if (isLoading) {
    return <>{skeleton}</>;
  }

  // Error with no data - show fallback
  if (error) {
    return fallback || <div className="p-4 text-red-600">Failed to load data</div>;
  }

  return null;
};

/**
 * Strategy 4: Optimistic Updates
 * Show expected result immediately, update when confirmed
 */
interface OptimisticUpdateProps<T> {
  actual: T | null;
  optimistic: T | null;
  isLoading: boolean;
  children: (data: T | null) => ReactNode;
}

export const OptimisticUpdate = <T,>({
  actual,
  optimistic,
  isLoading,
  children
}: OptimisticUpdateProps<T>) => {
  // Show optimistic data if loading, actual data otherwise
  const displayData = isLoading && optimistic ? optimistic : actual;
  return <>{children(displayData)}</>;
};

/**
 * Strategy 5: Progressive Loading
 * Load critical content first, then non-critical
 */
interface ProgressiveLoadProps {
  criticalContent: ReactNode;
  deferredContent?: ReactNode;
  deferredSkeleton?: ReactNode;
  isDeferredLoading?: boolean;
}

export const ProgressiveLoad = ({
  criticalContent,
  deferredContent,
  deferredSkeleton,
  isDeferredLoading = false
}: ProgressiveLoadProps) => {
  return (
    <>
      {/* Always show critical content first */}
      {criticalContent}

      {/* Deferred content loads with lower priority */}
      {isDeferredLoading && deferredSkeleton ? (
        deferredSkeleton
      ) : (
        deferredContent
      )}
    </>
  );
};

/**
 * Strategy 6: Skeleton Transition
 * Smooth fade from skeleton to content
 */
interface SkeletonTransitionProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export const SkeletonTransition = ({
  isLoading,
  skeleton,
  children
}: SkeletonTransitionProps) => {
  return (
    <div className="relative">
      {/* Skeleton with fade out */}
      <div
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-100" : "opacity-0 absolute inset-0 pointer-events-none"
        }`}
      >
        {skeleton}
      </div>

      {/* Content with fade in */}
      <div
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Strategy 7: Cached Data with Refresh
 * Keep previous response in state, show while fetching new
 */
export const useCachedData = <T,>(
  fetchFn: () => Promise<T>,
  initialData: T | null = null
) => {
  const [data, setData] = React.useState<T | null>(initialData);
  const [isLoading, setIsLoading] = React.useState(!initialData);
  const [error, setError] = React.useState<Error | null>(null);

  const refresh = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, isLoading, error, refresh };
};
