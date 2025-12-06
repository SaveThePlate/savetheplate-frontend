"use client";

import { FC, useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ClientOfferCardProps } from "./types";
import { PriceBadge } from "./shared/PriceBadge";
import { QuantityBadge } from "./shared/QuantityBadge";
import { ProviderOverlay } from "./shared/ProviderOverlay";
import { formatDateTime, isOfferExpired, DEFAULT_LOGO, getImageFallbacksForOffer } from "./utils";
import { getImageFallbacks } from "@/utils/imageUtils";
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";

export const ClientOfferCard: FC<ClientOfferCardProps> = ({
  offerId,
  imageSrc,
  imageAlt = "Offer image",
  title,
  description,
  price,
  originalPrice,
  quantity,
  expirationDate,
  pickupLocation,
  mapsLink,
  reserveLink,
  owner,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | undefined>(imageSrc);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [fallbacks, setFallbacks] = useState<string[]>([]);

  useEffect(() => {
    if (imageSrc) {
      const imageFallbacks = getImageFallbacksForOffer(imageSrc);
      setFallbacks(imageFallbacks);
      setCurrentImage(imageFallbacks[0] || DEFAULT_LOGO);
      setFallbackIndex(0);
    } else {
      setCurrentImage(DEFAULT_LOGO);
      setFallbacks([DEFAULT_LOGO]);
      setFallbackIndex(0);
    }
  }, [imageSrc]);

  const handleImageError = () => {
    const nextIndex = fallbackIndex + 1;
    if (nextIndex < fallbacks.length) {
      setFallbackIndex(nextIndex);
      setCurrentImage(fallbacks[nextIndex]);
    } else {
      setCurrentImage(DEFAULT_LOGO);
    }
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime(expirationDate);
  const expired = isOfferExpired(expirationDate);
  const isRescuePack = title.toLowerCase().includes("rescue pack");

  return (
    <Credenza open={isModalOpen} onOpenChange={setIsModalOpen}>
      <CredenzaTrigger asChild>
        <Card className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full hover:shadow-md transition-shadow cursor-pointer">
      {/* Image */}
      <div className="relative w-full h-48 sm:h-52">
        {currentImage ? (
          <Image
            src={currentImage || DEFAULT_LOGO}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onError={handleImageError}
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,..."
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}

        <PriceBadge price={price} originalPrice={originalPrice} />
        <QuantityBadge quantity={quantity} isExpired={expired} />
        <ProviderOverlay owner={owner} pickupLocation={pickupLocation} />

        {expired && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md z-10">
            Expired
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isRescuePack ? "Rescue Pack" : "Custom Offer"}
        </p>
        <p className="text-xs text-gray-600 mb-3">
          Pick up {formattedDate === "Today" ? "today" : formattedDate} {formattedTime}
        </p>
      </div>

      {/* Footer */}
      <CardFooter className="mt-4 flex flex-row gap-3 w-full items-center justify-between">
        {expired ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium">
            Expired
          </div>
        ) : quantity > 0 ? (
          <Link
            href={reserveLink}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-teal-600 text-white font-semibold rounded-lg shadow-sm"
          >
            Order
          </Link>
        ) : (
          <div className="flex-1"></div>
        )}

        {/* Details Modal */}
        <Credenza>
          <CredenzaTrigger asChild>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg shadow-sm">
              Details
            </button>
          </CredenzaTrigger>

          <CredenzaContent className="bg-white rounded-3xl shadow-lg p-6 max-w-md mx-auto border border-gray-100">
            <CredenzaHeader className="mb-3">
              <CredenzaTitle className="text-xl font-bold text-gray-900">
                {title}
              </CredenzaTitle>
            </CredenzaHeader>

            <CredenzaDescription className="text-sm text-gray-600 mb-3">
              Details about this offer: {title}
            </CredenzaDescription>

            <CredenzaBody className="space-y-3 text-gray-700 text-sm">
              <p>{description}</p>
              <p>
                <strong>Pickup Time:</strong> {formattedDate} at {formattedTime}
              </p>
              {mapsLink && (
                <p>
                  <strong>Location:</strong>{" "}
                  <a href={mapsLink} target="_blank" rel="noopener noreferrer" className="text-emerald-600">
                    {pickupLocation}
                  </a>
                </p>
              )}
            </CredenzaBody>
          </CredenzaContent>
        </Credenza>
      </CardFooter>
    </Card>
  );
};

