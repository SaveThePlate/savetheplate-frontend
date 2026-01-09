/**
 * Reusable skeleton loader components for consistent loading states
 */

import { Skeleton } from "@/components/ui/skeleton";

export const OfferCardSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-border p-4 space-y-4">
      {/* Image skeleton */}
      <Skeleton className="w-full h-48 rounded-xl" />
      
      {/* Title skeleton */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Description skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      {/* Price and button skeleton */}
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
};

export const OrderCardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="bg-white rounded-xl shadow-md border border-border p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-md border border-border p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <div className="bg-white rounded-xl shadow-md border border-border p-4 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-xl shadow-md border border-border p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const OffersGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <OfferCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const OrdersListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
};

export const PageSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        
        {/* Content */}
        <OffersGridSkeleton count={6} />
      </div>
    </div>
  );
};

export const FormSkeleton = () => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-border p-6 space-y-6">
      <Skeleton className="h-7 w-48" />
      
      <div className="space-y-4">
        {/* Form fields */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        ))}
        
        {/* Submit button */}
        <Skeleton className="h-12 w-full rounded-xl mt-6" />
      </div>
    </div>
  );
};

