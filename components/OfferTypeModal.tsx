"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";
import { Clock, Zap, Package, Edit3 } from "lucide-react";

interface OfferTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfferTypeModal: React.FC<OfferTypeModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleRapidOffer = () => {
    onClose();
    router.push("/provider/rapid-offer");
  };

  const handleNormalOffer = () => {
    onClose();
    router.push("/provider/addOffer");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t("offer_type_modal.title") || "Create New Offer"}
          </h2>
          <p className="text-gray-600 text-sm">
            {t("offer_type_modal.description") || "Choose how you want to create your offer"}
          </p>
        </div>

        <div className="space-y-3">
          {/* Rapid Offer Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRapidOffer}
            className="w-full p-4 border-2 border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                <Zap className="w-6 h-6 text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t("offer_type_modal.rapid_title") || "⚡ Rapid Offer"}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("offer_type_modal.rapid_description") || "Quick setup in 30 seconds. Perfect for simple items."}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {t("offer_type_modal.fast") || "Fast"}
                  </span>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    {t("offer_type_modal.simple") || "Simple"}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>

          {/* Normal Offer Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNormalOffer}
            className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <Edit3 className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {t("offer_type_modal.normal_title") || "📝 Detailed Offer"}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("offer_type_modal.normal_description") || "Full details with images, descriptions, and categories."}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {t("offer_type_modal.detailed") || "Detailed"}
                  </span>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {t("offer_type_modal.images") || "Images"}
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            {t("common.cancel") || "Cancel"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
