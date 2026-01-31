import React from "react";

interface LoadingSkeletonProps {
  type?: "card" | "list" | "detail" | "form";
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = "card", 
  count = 1 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case "card":
        return (
          <div className="bg-white rounded-lg shadow-lg p-4 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="flex justify-between items-center mt-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        );
      
      case "list":
        return (
          <div className="bg-white rounded-lg shadow p-4 animate-pulse mb-4">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        );
      
      case "detail":
        return (
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200"></div>
            <div className="container mx-auto px-4 py-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-6"></div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="h-32 bg-gray-200 rounded"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "form":
        return (
          <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        );
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

// Page level loading component
export const PageLoadingSkeleton: React.FC<{ type?: "home" | "detail" | "profile" }> = ({ 
  type = "home" 
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {type === "home" && (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingSkeleton type="card" count={6} />
          </div>
        </div>
      )}
      
      {type === "detail" && (
        <LoadingSkeleton type="detail" />
      )}
      
      {type === "profile" && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded mb-2 w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="space-y-4">
              <LoadingSkeleton type="form" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSkeleton;
