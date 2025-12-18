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
    ? "absolute top-2 left-2" 
    : "absolute bottom-2 right-2";

  if (quantity > 0) {
    return (
      <div className={`${positionClasses} bg-green-500 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md z-10 whitespace-nowrap`}>
        {quantity} left
      </div>
    );
  }

  return (
    <div className={`${positionClasses} px-2 py-0.5 text-xs font-medium rounded-full shadow-md bg-red-100 text-red-600 whitespace-nowrap`}>
      Sold Out
    </div>
  );
};

