"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/context/LanguageContext";
import { toast } from "react-toastify";
import { axiosInstance } from "@/lib/axiosInstance";
import { 
  X, 
  Edit2, 
  Package, 
  Clock, 
  MapPin, 
  Camera, 
  Tag,
  TrendingUp,
  Save,
  ArrowLeft
} from "lucide-react";

interface QuickEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  onUpdate: (updatedOffer: any) => void;
}

export const QuickEditModal: React.FC<QuickEditModalProps> = ({ 
  isOpen, 
  onClose, 
  offer, 
  onUpdate 
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed'>('quick');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: offer.title || '',
    price: offer.price || 0,
    quantity: offer.quantity || 0,
    description: offer.description || '',
    foodType: offer.foodType || 'other',
    taste: offer.taste || 'neutral',
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormData({
      title: offer.title || '',
      price: offer.price || 0,
      quantity: offer.quantity || 0,
      description: offer.description || '',
      foodType: offer.foodType || 'other',
      taste: offer.taste || 'neutral',
    });
    setHasChanges(false);
  }, [offer]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleQuickAction = async (action: string, value: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token");

      let payload: any = {};
      
      switch (action) {
        case 'price':
          payload.price = parseFloat(value);
          break;
        case 'quantity':
          payload.quantity = parseInt(value);
          break;
        case 'title':
          payload.title = value;
          break;
        default:
          break;
      }

      const response = await axiosInstance.put(`/offers/${offer.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onUpdate(response.data);
      toast.success(t("quick_edit.updated") || "Offer updated successfully");
    } catch (error: any) {
      toast.error(t("quick_edit.error") || "Failed to update offer");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No authentication token");

      const payload = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price.toString()),
        quantity: parseInt(formData.quantity.toString()),
        foodType: formData.foodType,
        taste: formData.taste,
      };

      const response = await axiosInstance.put(`/offers/${offer.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onUpdate(response.data);
      toast.success(t("quick_edit.updated") || "Offer updated successfully");
      onClose();
    } catch (error: any) {
      toast.error(t("quick_edit.error") || "Failed to update offer");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t("quick_edit.title") || "Quick Edit"}
              </h2>
              <p className="text-sm text-gray-500">{offer.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'quick'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            {t("quick_edit.quick_actions") || "Quick Actions"}
          </button>
          <button
            onClick={() => setActiveTab('detailed')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'detailed'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Edit2 className="w-4 h-4 inline mr-2" />
            {t("quick_edit.detailed") || "Detailed Edit"}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === 'quick' ? (
              <motion.div
                key="quick"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Quick Price Adjustment */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-green-700" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{t("quick_edit.price") || "Price"}</h3>
                        <p className="text-sm text-gray-500">{formData.price.toFixed(2)} dt</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('price', formData.price - 1)}
                      disabled={loading}
                    >
                      -1 dt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('price', formData.price - 0.5)}
                      disabled={loading}
                    >
                      -0.5 dt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('price', formData.price + 0.5)}
                      disabled={loading}
                    >
                      +0.5 dt
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('price', formData.price + 1)}
                      disabled={loading}
                    >
                      +1 dt
                    </Button>
                  </div>
                </div>

                {/* Quick Quantity Adjustment */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{t("quick_edit.quantity") || "Quantity"}</h3>
                        <p className="text-sm text-gray-500">{formData.quantity} {t("common.items") || "items"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('quantity', Math.max(0, formData.quantity - 1))}
                      disabled={loading}
                    >
                      -1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('quantity', Math.max(0, formData.quantity - 5))}
                      disabled={loading}
                    >
                      -5
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('quantity', formData.quantity + 1)}
                      disabled={loading}
                    >
                      +1
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickAction('quantity', formData.quantity + 5)}
                      disabled={loading}
                    >
                      +5
                    </Button>
                  </div>
                </div>

                {/* Quick Title Edit */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Edit2 className="w-4 h-4 text-purple-700" />
                    </div>
                    <h3 className="font-medium text-gray-900">{t("quick_edit.title") || "Title"}</h3>
                  </div>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={t("quick_edit.title_placeholder") || "Quick title update..."}
                    className="mb-2"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleQuickAction('title', formData.title)}
                    disabled={loading || !hasChanges}
                    className="w-full"
                  >
                    {t("quick_edit.update_title") || "Update Title"}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="detailed"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("quick_edit.title") || "Title"}
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder={t("quick_edit.title_placeholder") || "Offer title..."}
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("quick_edit.price") || "Price (dt)"}
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("quick_edit.quantity") || "Quantity"}
                  </label>
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("quick_edit.description") || "Description"}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder={t("quick_edit.description_placeholder") || "Describe your offer..."}
                  />
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("quick_edit.food_type") || "Food Type"}
                    </label>
                    <select
                      value={formData.foodType}
                      onChange={(e) => handleInputChange('foodType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="snack">🍪 {t("quick_edit.snack") || "Snack"}</option>
                      <option value="meal">🍽️ {t("quick_edit.meal") || "Meal"}</option>
                      <option value="beverage">🥤 {t("quick_edit.beverage") || "Beverage"}</option>
                      <option value="other">📦 {t("quick_edit.other") || "Other"}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("quick_edit.taste") || "Taste"}
                    </label>
                    <select
                      value={formData.taste}
                      onChange={(e) => handleInputChange('taste', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="sweet">🍰 {t("quick_edit.sweet") || "Sweet"}</option>
                      <option value="salty">🧂 {t("quick_edit.salty") || "Salty"}</option>
                      <option value="both">🍬 {t("quick_edit.both") || "Both"}</option>
                      <option value="neutral">⚪ {t("quick_edit.neutral") || "Neutral"}</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            {activeTab === 'detailed' && (
              <Button
                onClick={handleSaveAll}
                disabled={loading || !hasChanges}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {t("quick_edit.save_all") || "Save All"}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
