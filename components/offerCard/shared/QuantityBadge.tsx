import { FC } from "react";

interface QuantityBadgeProps {
  quantity: number;
  isExpired: boolean;
  position?: "top-left" | "bottom-right";
}

export const QuantityBadge: FC<QuantityBadgeProps> = ({ 
  quantity, 
  isExpired,
  position = "top-left" 
}) => {
  if (isExpired) return null;

  const positionClasses = position === "top-left" 
    ? "absolute top-2 left-2 sm:top-3 sm:left-3" 
    : "absolute bottom-2 right-2 sm:bottom-3 sm:right-3";

  if (quantity > 0) {
    return (
      <div className={`${positionClasses} z-20`}>
        <div className="bg-emerald-600 text-white rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-md">
          <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
            {quantity} {quantity === 1 ? "left" : "left"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${positionClasses} z-20`}>
      <div className="bg-gray-600 text-white rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-md">
        <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">
          Sold Out
        </span>
      </div>
    </div>
  );
};

