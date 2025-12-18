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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-gray-900">
            {t("rating.title") || "Rate Your Experience"}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-gray-600">
            {providerName
              ? t("rating.description_with_name", { name: providerName }) ||
                `How was your experience with ${providerName}?`
              : t("rating.description") || "How was your experience with this food provider?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
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
                    className={`w-10 h-10 sm:w-12 sm:h-12 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-gray-200 text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm sm:text-base font-medium text-gray-700">
                {rating === 5 && (t("rating.excellent") || "Excellent! ⭐⭐⭐⭐⭐")}
                {rating === 4 && (t("rating.very_good") || "Very Good! ⭐⭐⭐⭐")}
                {rating === 3 && (t("rating.good") || "Good! ⭐⭐⭐")}
                {rating === 2 && (t("rating.fair") || "Fair ⭐⭐")}
                {rating === 1 && (t("rating.poor") || "Poor ⭐")}
              </p>
            )}
          </div>

          {/* Quick Feedback Tags */}
          <div className="space-y-3">
            <label className="text-sm sm:text-base font-semibold text-gray-700">
              {t("rating.quick_feedback") || "What did you like? (Optional)"}
            </label>
            <div className="flex flex-wrap gap-2">
              {feedbackTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  disabled={submitting}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2`}
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
              className="text-sm sm:text-base font-semibold text-gray-700"
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
              className="min-h-[100px] resize-none text-sm sm:text-base"
              disabled={submitting}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500 {t("rating.characters") || "characters"}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {t("rating.skip") || "Skip"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

