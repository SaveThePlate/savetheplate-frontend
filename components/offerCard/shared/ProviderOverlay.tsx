import { FC } from "react";
import Image from "next/image";
import { resolveImageSource, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import { OfferOwner } from "../types";

interface ProviderOverlayProps {
  owner?: OfferOwner;
  pickupLocation: string;
  className?: string;
}

export const ProviderOverlay: FC<ProviderOverlayProps> = ({ 
  owner, 
  pickupLocation,
  className = "" 
}) => {
  if (!owner) return null;

  return (
    <div className={`absolute bottom-2 left-2 sm:bottom-3 sm:left-3 z-20 ${className}`}>
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 px-2 sm:px-2.5 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2">
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
          <Image
            src={sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
            alt={owner.username}
            width={24}
            height={24}
            className="object-cover w-full h-full"
            unoptimized={shouldUnoptimizeImage(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/logo.png";
            }}
          />
        </div>
        <p className="text-[10px] sm:text-xs font-semibold text-gray-800 truncate max-w-[70px] sm:max-w-[90px]">
          {owner.location || pickupLocation || "Location"}
        </p>
      </div>
    </div>
  );
};

