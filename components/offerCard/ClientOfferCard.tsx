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
import { Button } from "@/components/ui/button";
import { X, Star, MapPin, Clock, Package } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatDistance } from "@/utils/distanceUtils";

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
  distance,
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

  // Hide body scrollbar when modal is open
  useEffect(() => {
    if (isModalOpen) {
      // Save the current scrollbar width and body overflow
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      // Compensate for scrollbar width to prevent layout shift
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      // Restore body styles when modal is closed
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isModalOpen]);

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
        <Card className="flex flex-col bg-white rounded-2xl overflow-hidden border border-border shadow-sm h-full cursor-pointer group">
      {/* Image Section - Similar to Too Good To Go */}
      <div className="relative w-full h-32 sm:h-36 md:h-40 overflow-hidden bg-muted">
        {currentImage && currentImage !== DEFAULT_LOGO ? (
          <Image
            key={currentImage}
            src={sanitizeImageUrl(currentImage)}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            onError={handleImageError}
            className="object-cover"
            unoptimized={shouldUnoptimizeImage(currentImage)}
          />
        ) : (
          <Image
            key="default-logo"
            src={DEFAULT_LOGO}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover"
          />
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
      <div className="flex flex-col flex-1 bg-white p-3 sm:p-4">
        {/* Offer Title - Dark Teal, Prominent (replaces provider name) */}
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1 line-clamp-2">
          {title}
        </h3>

        {/* Distance Badge */}
        {distance !== undefined && distance !== Infinity && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span className="text-xs text-emerald-700 font-medium">
              {formatDistance(distance)}
            </span>
          </div>
        )}

        {/* Category Badges */}
        {(foodType || taste) && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {foodType && (
              <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-blue-100 text-blue-800">
                {foodType === "snack" && "🍪"}
                {foodType === "meal" && "🍽️"}
                {foodType === "beverage" && "🥤"}
                {foodType === "other" && "📦"}
                <span className="ml-1">{t(`offers.food_type_${foodType}`) || foodType}</span>
              </span>
            )}
            {taste && (
              <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold bg-purple-100 text-purple-800">
                {taste === "sweet" && "🍰"}
                {taste === "salty" && "🧂"}
                {taste === "both" && "🍬"}
                {taste === "neutral" && "⚪"}
                <span className="ml-1">{t(`offers.taste_${taste}`) || taste}</span>
              </span>
            )}
          </div>
        )}

        {/* Bottom Row: Rating (left) and Pricing (right) */}
        <div className="flex items-center justify-between mt-auto pt-2 sm:pt-3 border-t border-border">
          {/* Rating - Bottom Left (Light Green Star + Number) */}
          {displayRating ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-primary text-primary" />
              <span className="text-xs sm:text-sm md:text-base font-semibold text-primary">
                {displayRating}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 fill-muted text-muted-foreground" />
              <span className="text-xs sm:text-sm md:text-base font-medium text-muted-foreground">
                {t("offers.no_rating") || "New"}
              </span>
            </div>
          )}

          {/* Pricing - Bottom Right (Original price strikethrough + Discounted price bold) */}
          <div className="flex flex-col items-end">
            {originalPrice && originalPrice > price ? (
              <>
                <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                  {originalPrice.toFixed(2)} dt
                </span>
                <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                  {price.toFixed(2)} dt
                </span>
              </>
            ) : (
              <span className="text-base sm:text-lg md:text-xl font-bold text-foreground">
                {price.toFixed(2)} dt
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Order Button */}
      <CardFooter 
        className="px-3 sm:px-4 md:px-5 pb-3 sm:pb-4 md:pb-5 pt-0 flex flex-row gap-2 sm:gap-3 w-full items-center justify-between border-t border-border bg-white"
        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking footer
      >
        {expired ? (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-semibold text-sm">
            {t("common.expired")}
          </div>
        ) : quantity > 0 ? (
          <Button
            asChild
            variant="emerald"
            className="flex-1 hover:scale-[1.02] transition-all duration-200"
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking order button
          >
            <Link href={reserveLink}>
              {t("common.order_now")}
            </Link>
          </Button>
        ) : (
          <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-muted-foreground rounded-xl font-semibold text-sm">
            {t("common.sold_out")}
          </div>
        )}
      </CardFooter>
    </Card>
    </CredenzaTrigger>

      {/* Details Modal - Too Good To Go Style */}
      <CredenzaContent className="bg-white !rounded-none shadow-2xl w-full md:max-w-xl lg:max-w-2xl border-0 md:border border-border p-0 overflow-hidden max-h-[92vh] md:max-h-[90vh] flex flex-col [&>button]:!hidden">
        {/* Accessibility: DialogTitle and Description for screen readers */}
        <VisuallyHidden>
          <CredenzaTitle>{title}</CredenzaTitle>
          <CredenzaDescription>{description}</CredenzaDescription>
        </VisuallyHidden>
        
        {/* Content Container */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Hero Image */}
          <div className="relative w-full h-40 sm:h-48 lg:h-44 flex-shrink-0 overflow-hidden">
            {currentImage && currentImage !== DEFAULT_LOGO ? (
              <Image
                key={currentImage}
                src={sanitizeImageUrl(currentImage)}
                alt={title}
                fill
                sizes="(max-width: 640px) calc(100vw - 1rem), 512px"
                className="object-cover"
                unoptimized={shouldUnoptimizeImage(currentImage)}
                onError={handleImageError}
              />
            ) : (
              <Image
                key="default-logo-modal"
                src={DEFAULT_LOGO}
                alt={title}
                fill
                sizes="(max-width: 640px) calc(100vw - 1rem), 512px"
                className="object-cover"
              />
            )}
            
            {/* Close Button - Top Right */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-50 rounded-full bg-white p-1.5 shadow-lg hover:bg-gray-50 transition-colors border border-border flex items-center justify-center cursor-pointer"
              aria-label="Close"
              type="button"
            >
              <X className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Content Section */}
          <div className="bg-white flex-1 min-h-0 flex flex-col">
            {/* Provider Header */}
            <div className="px-4 sm:px-5 pt-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                {owner && (
                  <div className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-white flex-shrink-0">
                    <Image
                      src={sanitizeImageUrl(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
                      alt={owner.location || pickupLocation}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                      unoptimized={shouldUnoptimizeImage(owner.profileImage ? resolveImageSource(owner.profileImage) : "/logo.png")}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/logo.png";
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-sm sm:text-base font-bold text-foreground mb-0.5">
                    {owner?.location || pickupLocation}
                  </h2>
                  {/* Rating */}
                  {displayRating ? (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span className="text-xs font-semibold text-primary">
                        {displayRating}
                      </span>
                      {totalRatings && totalRatings > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          ({totalRatings})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-muted text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {t("offers.no_rating") || "New"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Offer Title and Pricing */}
            <div className="px-4 sm:px-5 pt-2.5 pb-2 border-b border-border">
              <h1 className="text-base sm:text-lg font-bold text-foreground mb-1.5">
                {title}
              </h1>
              
              {/* Pricing */}
              <div className="flex items-baseline gap-2">
                {originalPrice && originalPrice > price ? (
                  <>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground line-through">
                        {originalPrice.toFixed(2)} dt
                      </span>
                      <span className="text-xl sm:text-2xl font-bold text-primary">
                        {price.toFixed(2)} dt
                      </span>
                    </div>
                    <div className="flex-1" />
                    <div className="bg-primary/10 border border-primary/20 rounded-md px-2 py-0.5">
                      <span className="text-[10px] font-bold text-primary">
                        {Math.round(((originalPrice - price) / originalPrice) * 100)}% {t("offers.save") || "SAVED"}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-xl sm:text-2xl font-bold text-primary">
                    {price.toFixed(2)} dt
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="px-4 sm:px-5 py-2 border-b border-border">
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line line-clamp-2">
                  {description}
                </p>
              </div>
            )}

            {/* Key Information Cards */}
            <div className="px-4 sm:px-5 py-2 flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {/* Pickup Time */}
                <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-foreground mb-0.5">
                      {t("offers.pickup_time") || "Pickup Time"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      <span className="font-medium">{formattedDate === "Today" ? t("common.today") : formattedDate}</span>
                      {formattedTime && (
                        <span className="text-primary font-semibold ml-1">
                          {formattedTime.includes(" - ") ? formattedTime : ` ${t("common.at")} ${formattedTime}`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Location */}
                {(owner?.mapsLink || mapsLink) && (
                  <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-blue-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-semibold text-foreground mb-0.5">
                        {t("offers.pickup_location") || "Pickup Location"}
                      </p>
                      <a
                        href={owner?.mapsLink || mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-primary font-medium hover:underline inline-flex items-center gap-0.5 break-words"
                      >
                        {pickupLocation}
                        <span className="text-[8px] flex-shrink-0">↗</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Quantity Available */}
                <div className="flex items-start gap-2 p-2 bg-success/10 rounded-lg border border-success/20">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                    <Package className="w-3.5 h-3.5 text-success" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-foreground mb-0.5">
                      {t("offers.quantity_available") || "Available"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {quantity} {quantity === 1 ? t("common.item") || "item" : t("common.items") || "items"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="bg-white p-2.5 sm:p-3 flex-shrink-0">
          {!expired && quantity > 0 ? (
            <Button
              asChild
              variant="emerald"
              size="lg"
              className="w-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] font-bold"
              onClick={() => setIsModalOpen(false)}
            >
              <Link href={reserveLink}>
                {t("common.order_now") || "Reserve Now"}
              </Link>
            </Button>
          ) : expired ? (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-muted-foreground text-sm sm:text-base font-semibold rounded-xl border border-border">
              {t("common.expired")}
            </div>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-muted-foreground text-sm sm:text-base font-semibold rounded-xl border border-border">
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

