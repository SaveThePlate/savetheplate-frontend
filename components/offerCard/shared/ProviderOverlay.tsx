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
    <div className={`absolute bottom-2 left-2 flex items-center gap-2 z-10 bg-white/90 backdrop-blur-sm px-2 py-1.5 rounded-full shadow-lg border border-white/50 ${className}`}>
      <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white flex-shrink-0">
        <Image
          src={sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
          alt={owner.username}
          width={32}
          height={32}
          className="object-cover w-full h-full"
          unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png"))}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/logo.png";
          }}
        />
      </div>
      <p className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">
        {owner.location || pickupLocation}
      </p>
    </div>
  );
};

