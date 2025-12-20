import { FC } from "react";

interface PriceBadgeProps {
  price: number;
  originalPrice?: number;
  className?: string;
}

export const PriceBadge: FC<PriceBadgeProps> = ({ price, originalPrice, className = "" }) => {
  const discount = originalPrice && originalPrice > price 
    ? Math.round((1 - price / originalPrice) * 100) 
    : null;

  return (
    <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-20 ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 px-2 sm:px-2.5 py-1.5 sm:py-2">
        <div className="flex flex-col items-end leading-tight">
          <div className="flex items-baseline gap-1">
            <span className="font-bold text-sm sm:text-base text-emerald-600">{price}</span>
            <span className="text-[10px] sm:text-xs text-gray-600 font-medium">dt</span>
          </div>
          {originalPrice && originalPrice > price && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] sm:text-[10px] text-gray-500 line-through">
                {originalPrice.toFixed(2)}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                -{discount}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

