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
    <div className={`absolute top-2 right-2 bg-emerald-600 text-white font-semibold px-2.5 py-1.5 rounded-full text-xs shadow-md z-10 ${className}`}>
      <div className="flex flex-col items-end leading-tight">
        <span className="font-bold text-sm">{price} dt</span>
        {originalPrice && originalPrice > price && (
          <>
            <span className="text-[10px] font-normal line-through opacity-75">
              {originalPrice.toFixed(2)} dt
            </span>
            <span className="text-[10px] font-bold mt-0.5 bg-white/20 px-1 py-0.5 rounded">
              -{discount}%
            </span>
          </>
        )}
      </div>
    </div>
  );
};

