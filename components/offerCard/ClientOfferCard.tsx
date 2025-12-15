"use client";

import { FC, useState, useEffect, memo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ClientOfferCardProps } from "./types";
import { QuantityBadge } from "./shared/QuantityBadge";
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
  CredenzaClose,
} from "@/components/ui/credenza";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { X, Star } from "lucide-react";
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
  foodType,
  taste,
  owner,
  averageRating,
  totalRatings,
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

  const providerName = owner?.location || owner?.username || pickupLocation;
  const displayRating = averageRating && averageRating > 0 ? averageRating.toFixed(1) : null;

  return (
    <Credenza open={isModalOpen} onOpenChange={setIsModalOpen}>
      <CredenzaTrigger asChild>
        <Card className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-full hover:shadow-xl hover:border-emerald-400 hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
      {/* Image Section - Similar to Too Good To Go */}
      <div className="relative w-full h-48 sm:h-52 md:h-56 overflow-hidden bg-gray-100">
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
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}

        {/* Provider Logo in bottom-left corner of image (like Too Good To Go) */}
        {owner && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border-2 border-white shadow-lg overflow-hidden flex-shrink-0">
              <Image
                src={sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
                alt={owner.username || providerName}
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
          </div>
        )}

        {/* Quantity Badge - top right */}
        <QuantityBadge quantity={quantity} isExpired={expired} />

        {/* Expired Badge */}
        {expired && (
          <div className="absolute top-2 left-2 bg-gray-800/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md z-10">
            {t("common.expired")}
          </div>
        )}
      </div>

      {/* Lower Section - Textual Information (Too Good To Go style) */}
      <div className="flex flex-col flex-1 bg-gray-50 p-4 sm:p-5">
        {/* Provider Name - Dark Teal, Prominent */}
        <h3 className="text-lg sm:text-xl font-bold text-teal-800 mb-1.5 line-clamp-1">
          {providerName}
        </h3>

        {/* Offer Type - Lighter Teal */}
        <p className="text-sm sm:text-base text-teal-600 mb-4 font-medium">
          {isRescuePack ? t("offers.rescue_pack") : t("offers.custom_offer")}
        </p>

        {/* Bottom Row: Rating (left) and Pricing (right) */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-200">
          {/* Rating - Bottom Left (Light Green Star + Number) */}
          {displayRating ? (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-emerald-400 text-emerald-400" />
              <span className="text-sm sm:text-base font-semibold text-emerald-600">
                {displayRating}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-gray-300 text-gray-300" />
              <span className="text-sm sm:text-base font-medium text-gray-400">
                {t("offers.no_rating") || "New"}
              </span>
            </div>
          )}

          {/* Pricing - Bottom Right (Original price strikethrough + Discounted price bold) */}
          <div className="flex flex-col items-end">
            {originalPrice && originalPrice > price ? (
              <>
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  {originalPrice.toFixed(2)} dt
                </span>
                <span className="text-lg sm:text-xl font-bold text-teal-800">
                  {price.toFixed(2)} dt
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-bold text-teal-800">
                {price.toFixed(2)} dt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Order Button */}
      <CardFooter 
        className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex flex-row gap-3 w-full items-center justify-between border-t border-gray-200 bg-white"
        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking footer
      >
        {expired ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-semibold text-sm">
            {t("common.expired")}
          </div>
        ) : quantity > 0 ? (
          <Link
            href={reserveLink}
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking order button
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl shadow-sm hover:bg-emerald-700 hover:shadow-md hover:scale-[1.02] transition-all duration-200 text-sm sm:text-base"
          >
            {t("common.order_now")}
          </Link>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-semibold text-sm">
            {t("common.sold_out")}
          </div>
        )}
      </CardFooter>
    </Card>
    </CredenzaTrigger>

      {/* Details Modal */}
      <CredenzaContent className="bg-white rounded-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-lg border border-gray-100 p-0 overflow-hidden max-h-[90vh] sm:max-h-[95vh] flex flex-col">
        {/* Accessibility: DialogTitle and Description for screen readers */}
        <VisuallyHidden>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </VisuallyHidden>
        
        {/* Close Button */}
        <button
          onClick={() => setIsModalOpen(false)}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[110] rounded-full bg-white/90 backdrop-blur-sm p-2 shadow-lg hover:bg-white transition-colors border border-gray-200 flex items-center justify-center cursor-pointer"
          aria-label="Close"
          type="button"
        >
          <X className="h-4 w-4 text-gray-700" />
        </button>
        
        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Large Image at Top */}
          <div className="relative w-full h-48 sm:h-64 flex-shrink-0">
            {currentImage ? (
              <Image
                src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
                alt={title}
                fill
                sizes="(max-width: 640px) calc(100vw - 2rem), 512px"
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

          <div className="p-4 sm:p-6">
          {/* Store Information */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0 mb-4">
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
            <div className="text-left sm:text-right">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{price} dt</p>
              {originalPrice && originalPrice > price && (
                <p className="text-xs sm:text-sm text-gray-500 line-through">{originalPrice.toFixed(2)} dt</p>
              )}
            </div>
          </div>

          {/* Offer Details */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                {isRescuePack ? t("offers.rescue_pack") : t("offers.custom_offer")}
              </span>
              {foodType && foodType !== "other" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  {t(`offers.food_type_${foodType}`) || foodType}
                </span>
              )}
              {taste && taste !== "neutral" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  {t(`offers.taste_${taste}`) || taste}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-800 leading-relaxed">{description}</p>
          </div>

          {/* Pickup Information */}
          <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-xl">
            <p className="text-xs sm:text-sm font-medium text-gray-900 mb-2">{t("offers.pickup_details")}</p>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
              <span className="font-semibold text-base sm:text-lg">🕐</span>
              <span>
                <span className="font-medium">{formattedDate === "Today" ? t("common.today") : formattedDate}</span>
                {formattedTime && (
                  <span className="font-semibold text-emerald-700 ml-1 sm:ml-2">
                    {formattedTime.includes(" - ") ? formattedTime : ` ${t("common.at")} ${formattedTime}`}
                  </span>
                )}
              </span>
            </div>
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
                className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-emerald-600 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl hover:bg-emerald-700 transition-colors"
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
        </div>
      </CredenzaContent>
    </Credenza>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ClientOfferCard = memo(ClientOfferCardComponent);

