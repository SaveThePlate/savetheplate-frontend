"use client";

import { FC, useState, useEffect, memo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ClientOfferCardProps } from "./types";
import { PriceBadge } from "./shared/PriceBadge";
import { QuantityBadge } from "./shared/QuantityBadge";
import { ProviderOverlay } from "./shared/ProviderOverlay";
import { formatDateTime, formatDateTimeRange, isOfferExpired, DEFAULT_LOGO, getImageFallbacksForOffer } from "./utils";
import { getImageFallbacks, resolveImageSource, shouldUnoptimizeImage, sanitizeImageUrl } from "@/utils/imageUtils";
import {
  Credenza,
  CredenzaTrigger,
  CredenzaContent,
  CredenzaDescription,
  CredenzaHeader,
  CredenzaTitle,
  CredenzaBody,
} from "@/components/ui/credenza";
import { useLanguage } from "@/context/LanguageContext";

const ClientOfferCardComponent: FC<ClientOfferCardProps> = ({
  offerId,
  imageSrc,
  imageAlt = "Offer image",
  title,
  description,
  price,
  originalPrice,
  quantity,
  expirationDate,
  pickupStartTime,
  pickupEndTime,
  pickupLocation,
  mapsLink,
  reserveLink,
  owner,
}) => {
  const { t } = useLanguage();
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

  const { date: formattedDate, time: formattedTime } = formatDateTimeRange(
    pickupStartTime,
    pickupEndTime,
    expirationDate
  );
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
            src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onError={handleImageError}
            priority
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,..."
            className="object-cover"
            unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
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
            {t("common.expired")}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm font-medium text-gray-700 mb-1">
          {isRescuePack ? t("offers.rescue_pack") : t("offers.custom_offer")}
        </p>
        <p className="text-xs text-gray-600 mb-3">
          {t("offers.pick_up", { 
            date: formattedDate === "Today" ? t("common.today") : formattedDate,
            time: formattedTime ? (formattedTime.includes(" - ") ? ` ${t("common.between")} ${formattedTime}` : ` ${t("common.at")} ${formattedTime}`) : ""
          })}
        </p>
      </div>

      {/* Footer */}
      <CardFooter 
        className="mt-4 flex flex-row gap-3 w-full items-center justify-between"
        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking footer
      >
        {expired ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium">
            {t("common.expired")}
          </div>
        ) : quantity > 0 ? (
          <Link
            href={reserveLink}
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking order button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-teal-600 text-white font-semibold rounded-lg shadow-sm hover:bg-teal-700 transition-colors"
          >
            {t("common.order_now")}
          </Link>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium">
            {t("common.sold_out")}
          </div>
        )}
      </CardFooter>
    </Card>
    </CredenzaTrigger>

      {/* Details Modal */}
      <CredenzaContent className="bg-white rounded-3xl shadow-xl max-w-lg mx-auto border border-gray-100 p-0 overflow-hidden">
        {/* Large Image at Top */}
        <div className="relative w-full h-64">
          {currentImage ? (
            <Image
              src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
              alt={title}
              fill
              sizes="100vw"
              className="object-cover"
              unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image</span>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Store Information */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {owner && (
                <div className="w-12 h-12 rounded-full border-2 border-gray-200 overflow-hidden bg-white flex-shrink-0">
                  <Image
                    src={sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
                    alt={owner.location || pickupLocation}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                    unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png"))}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/logo.png";
                    }}
                  />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {owner?.location || pickupLocation}
                </h3>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900">{price} dt</p>
              {originalPrice && originalPrice > price && (
                <p className="text-sm text-gray-500 line-through">{originalPrice.toFixed(2)} dt</p>
              )}
            </div>
          </div>

          {/* Offer Details */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              {isRescuePack ? t("offers.rescue_pack") : t("offers.custom_offer")}
            </p>
            <p className="text-base text-gray-800 leading-relaxed">{description}</p>
          </div>

          {/* Pickup Information */}
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-900 mb-1">{t("offers.pickup_details")}</p>
            <p className="text-sm text-gray-600">
              {formattedDate}{formattedTime && (formattedTime.includes(" - ") ? ` ${t("common.between")} ${formattedTime}` : ` ${t("common.at")} ${formattedTime}`)}
            </p>
            {(owner?.mapsLink || mapsLink) && (
              <a
                href={owner?.mapsLink || mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-emerald-600 font-medium mt-1 inline-flex items-center gap-1 hover:underline"
              >
                {t("common.view_on_maps")}
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!expired && quantity > 0 && (
              <Link
                href={reserveLink}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                {t("common.order_now")}
              </Link>
            )}
            {expired && (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 font-semibold rounded-xl">
                {t("common.expired")}
              </div>
            )}
            {quantity === 0 && !expired && (
              <div className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-500 font-semibold rounded-xl">
                {t("common.sold_out")}
              </div>
            )}
          </div>
        </div>
      </CredenzaContent>
    </Credenza>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ClientOfferCard = memo(ClientOfferCardComponent);
