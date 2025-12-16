"use client";

import { FC, useState, useEffect, memo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";
import { ClientOfferCardProps } from "./types";
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
  CredenzaClose,
} from "@/components/ui/credenza";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { X, Star, MapPin, Clock, Package } from "lucide-react";
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

        {/* Quantity Badge - top right */}
        <QuantityBadge quantity={quantity} isExpired={expired} />

        {/* Expired Badge */}
        {expired && (
          <div className="absolute top-3 right-3 bg-gray-800/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-md z-10">
            {t("common.expired")}
          </div>
        )}

        {/* Provider Overlay - Same as ProviderOfferCard */}
        <ProviderOverlay owner={owner} pickupLocation={pickupLocation} />
      </div>

      {/* Lower Section - Textual Information (Too Good To Go style) */}
      <div className="flex flex-col flex-1 bg-gray-50 p-4 sm:p-5">
        {/* Offer Title - Dark Teal, Prominent (replaces provider name) */}
        <h3 className="text-lg sm:text-xl font-bold text-teal-800 mb-1.5 line-clamp-2">
          {title}
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

      {/* Details Modal - Too Good To Go Style */}
      <CredenzaContent className="bg-white rounded-3xl sm:rounded-3xl shadow-2xl max-w-[calc(100vw-1rem)] sm:max-w-lg border-0 p-0 overflow-hidden max-h-[95vh] flex flex-col">
        {/* Accessibility: DialogTitle and Description for screen readers */}
        <VisuallyHidden>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </VisuallyHidden>
        
        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {/* Large Hero Image */}
          <div className="relative w-full h-64 sm:h-80 flex-shrink-0 overflow-hidden">
            {currentImage ? (
              <Image
                src={sanitizeImageUrl(currentImage) || DEFAULT_LOGO}
                alt={title}
                fill
                sizes="(max-width: 640px) calc(100vw - 1rem), 512px"
                className="object-cover"
                unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(currentImage) || DEFAULT_LOGO)}
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
            
            {/* Quantity Badge on Image - Top Left */}
            {!expired && (
              <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 max-w-[calc(100%-1rem)]">
                <div className="bg-green-500 text-white px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold shadow-md whitespace-nowrap">
                  {quantity > 0 ? `${quantity} left` : "Sold Out"}
                </div>
              </div>
            )}
            
            {/* Close Button - Top Right */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 rounded-full bg-white/95 backdrop-blur-sm p-2 shadow-lg hover:bg-white transition-colors border border-gray-200 flex items-center justify-center cursor-pointer"
              aria-label="Close"
              type="button"
            >
              <X className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* Content Section */}
          <div className="bg-white">
            {/* Provider Header - Prominent */}
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                {owner && (
                  <div className="w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-white flex-shrink-0">
                    <Image
                      src={sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
                      alt={owner.location || pickupLocation}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                      unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png"))}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logo.png";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                    {owner?.location || pickupLocation}
                  </h2>
                  {/* Rating */}
                  {displayRating ? (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-600">
                        {displayRating}
                      </span>
                      {totalRatings && totalRatings > 0 && (
                        <span className="text-xs text-gray-500">
                          ({totalRatings})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-gray-300 text-gray-300" />
                      <span className="text-xs text-gray-400">
                        {t("offers.no_rating") || "New"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Offer Title and Pricing */}
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {title}
              </h1>
              
              {/* Pricing - Prominent */}
              <div className="flex items-baseline gap-3">
                {originalPrice && originalPrice > price ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500 line-through">
                        {originalPrice.toFixed(2)} dt
                      </span>
                      <span className="text-3xl sm:text-4xl font-bold text-teal-700">
                        {price.toFixed(2)} dt
                      </span>
                    </div>
                    <div className="flex-1" />
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
                      <span className="text-sm font-bold text-emerald-700">
                        {Math.round(((originalPrice - price) / originalPrice) * 100)}% {t("offers.save") || "SAVED"}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-teal-700">
                    {price.toFixed(2)} dt
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="px-5 sm:px-6 py-5 border-b border-gray-100">
                <p className="text-base text-gray-700 leading-relaxed whitespace-pre-line">
                  {description}
                </p>
              </div>
            )}

            {/* Key Information Cards */}
            <div className="px-5 sm:px-6 py-5 space-y-3">
              {/* Pickup Time */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Clock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {t("offers.pickup_time") || "Pickup Time"}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{formattedDate === "Today" ? t("common.today") : formattedDate}</span>
                    {formattedTime && (
                      <span className="text-teal-700 font-semibold ml-2">
                        {formattedTime.includes(" - ") ? formattedTime : ` ${t("common.at")} ${formattedTime}`}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Location */}
              {(owner?.mapsLink || mapsLink) && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {t("offers.pickup_location") || "Pickup Location"}
                    </p>
                    <a
                      href={owner?.mapsLink || mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-teal-600 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      {pickupLocation}
                      <span className="text-xs">↗</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Quantity Available */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <Package className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {t("offers.quantity_available") || "Available"}
                  </p>
                  <p className="text-sm text-gray-700">
                    {quantity} {quantity === 1 ? t("common.item") || "item" : t("common.items") || "items"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="border-t border-gray-200 bg-white p-4 sm:p-5 flex-shrink-0">
          {!expired && quantity > 0 ? (
            <Link
              href={reserveLink}
              onClick={() => setIsModalOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white text-lg font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              {t("common.order_now") || "Reserve Now"}
            </Link>
          ) : expired ? (
            <div className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-500 text-lg font-semibold rounded-2xl">
              {t("common.expired")}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-500 text-lg font-semibold rounded-2xl">
              {t("common.sold_out")}
            </div>
          )}
        </div>
      </CredenzaContent>
    </Credenza>
  );
};

// Memoize component to prevent unnecessary re-renders
export const ClientOfferCard = memo(ClientOfferCardComponent);

