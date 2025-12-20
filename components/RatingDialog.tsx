"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  providerId: number;
  providerName?: string;
  onRatingSubmitted?: () => void;
}

const RatingDialog: React.FC<RatingDialogProps> = ({
  open,
  onOpenChange,
  orderId,
  providerId,
  providerName,
  onRatingSubmitted,
}) => {
  const { t } = useLanguage();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Quick feedback tags similar to Too Good To Go
  const feedbackTags = [
    "great_value",
    "fresh_food",
    "friendly_staff",
    "good_quantity",
    "excellent_quality",
    "fast_pickup",
    "well_packaged",
  ];

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error(t("rating.select_rating") || "Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error(t("rating.login_required") || "Please log in to submit a rating");
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/ratings`,
        {
          orderId,
          providerId,
          rating,
          tags: selectedTags,
          comment: comment.trim() || undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(t("rating.submitted_success") || "Thank you for your rating!");
      onRatingSubmitted?.();
      handleClose();
    } catch (err: any) {
      console.error("Failed to submit rating:", err);
      // Check for specific error messages from backend
      let errorMsg = t("rating.submit_failed") || "Failed to submit rating. Please try again.";
      
      if (err?.response?.data?.message) {
        const backendMsg = err.response.data.message;
        // Use backend message if it's user-friendly
        if (backendMsg && !backendMsg.includes('Error') && !backendMsg.includes('Exception')) {
          errorMsg = backendMsg;
        } else {
          errorMsg = sanitizeErrorMessage(err, {
            action: "submit rating",
            defaultMessage: errorMsg,
          });
        }
      } else {
        errorMsg = sanitizeErrorMessage(err, {
          action: "submit rating",
          defaultMessage: errorMsg,
        });
      }
      
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setRating(0);
      setHoveredRating(0);
      setSelectedTags([]);
      setComment("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg lg:max-w-2xl bg-white">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
            {t("rating.title") || "Rate Your Experience"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 sm:mt-2">
            {providerName
              ? t("rating.description_with_name", { name: providerName }) ||
                `How was your experience with ${providerName}?`
              : t("rating.description") || "How was your experience with this food provider?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4 overflow-y-auto flex-1 min-h-0">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-2 sm:space-y-3">
            <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 rounded-full transition-transform hover:scale-110 active:scale-95"
                  disabled={submitting}
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs sm:text-sm lg:text-base font-medium text-foreground text-center px-2">
                {rating === 5 && (t("rating.excellent") || "Excellent! ⭐⭐⭐⭐⭐")}
                {rating === 4 && (t("rating.very_good") || "Very Good! ⭐⭐⭐⭐")}
                {rating === 3 && (t("rating.good") || "Good! ⭐⭐⭐")}
                {rating === 2 && (t("rating.fair") || "Fair ⭐⭐")}
                {rating === 1 && (t("rating.poor") || "Poor ⭐")}
              </p>
            )}
          </div>

          {/* Quick Feedback Tags */}
          <div className="space-y-2 sm:space-y-3">
            <label className="text-xs sm:text-sm lg:text-base font-semibold text-foreground">
              {t("rating.quick_feedback") || "What did you like? (Optional)"}
            </label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {feedbackTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  disabled={submitting}
                  className={`px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white border border-border text-foreground hover:bg-emerald-50 hover:border-emerald-600"
                  } focus:outline-none focus:ring-2 focus:ring-emerald-600/20`}
                >
                  {t(`rating.tag.${tag}`) || tag.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Comment Field */}
          <div className="space-y-2">
            <label
              htmlFor="rating-comment"
              className="text-xs sm:text-sm lg:text-base font-semibold text-foreground"
            >
              {t("rating.comment_label") || "Additional comments (Optional)"}
            </label>
            <Textarea
              id="rating-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                t("rating.comment_placeholder") ||
                "Share your experience... (e.g., food quality, service, packaging)"
              }
              className="min-h-[80px] sm:min-h-[100px] resize-none text-xs sm:text-sm lg:text-base bg-white border-border"
              disabled={submitting}
              maxLength={500}
            />
            <p className="text-[10px] sm:text-xs text-muted-foreground text-right">
              {comment.length}/500 {t("rating.characters") || "characters"}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 flex-shrink-0 pt-2 sm:pt-4 border-t border-border mt-2 sm:mt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            {t("rating.skip") || "Skip"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                {t("rating.submitting") || "Submitting..."}
              </>
            ) : (
              t("rating.submit") || "Submit Rating"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog;

