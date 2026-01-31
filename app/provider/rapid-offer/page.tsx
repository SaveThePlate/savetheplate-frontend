"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { axiosInstance } from "@/lib/axiosInstance";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const RapidOffer = () => {
  const { t } = useLanguage();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupStartTime, setPickupStartTime] = useState("");
  const [pickupEndTime, setPickupEndTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Default pickup date = today
  useEffect(() => {
    const now = new Date();
    setPickupDate(now.toISOString().slice(0, 10));
  }, []);

  // Preset options
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const formatDate = (d: Date) => d.toISOString().slice(0, 10);

  const presets = [
    { label: "Aujourd'hui 14h-18h", date: formatDate(today), start: "14:00", end: "18:00" },
    { label: "Aujourd'hui 17h-20h", date: formatDate(today), start: "17:00", end: "20:00" },
    { label: "Demain 10h-14h", date: formatDate(tomorrow), start: "10:00", end: "14:00" },
    { label: "Demain 14h-18h", date: formatDate(tomorrow), start: "14:00", end: "18:00" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/signIn");
        return;
      }

      await axiosInstance.post(
        "/offers/rapid-minimal",
        {
          title,
          price: parseFloat(price),
          quantity: parseInt(quantity, 10),
          pickupStartTime: `${pickupDate}T${pickupStartTime || "14:00"}:00`,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setTitle("");
      setPrice("");
      setQuantity("");
      setPickupDate(formatDate(today));
      setPickupStartTime("");
      setPickupEndTime("");
    } catch (err: any) {
      setError(err?.response?.data?.message || t("provider.rapid_offer.error") || "Failed to create offer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted">
      <motion.div
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-[#1B4332]">
          {t("provider.rapid_offer.title") || "Rapid Offer Posting"}
        </h1>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 mb-4 text-center animate-fade-in">
            {t("provider.rapid_offer.success") || "Offer created successfully!"}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-center animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <label className="block mb-1 font-medium">{t("provider.rapid_offer.form.title") || "Title"}</label>
            <input
              type="text"
              className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </motion.div>

          {/* Price & Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <label className="block mb-1 font-medium">{t("provider.rapid_offer.form.price") || "Price (dt)"}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <label className="block mb-1 font-medium">{t("provider.rapid_offer.form.quantity") || "Quantity"}</label>
              <input
                type="number"
                min="1"
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                required
              />
            </motion.div>
          </div>

          {/* Presets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-4"
          >
            <div className="font-semibold mb-2">⚡ Presets Rapides</div>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  className="px-3 py-1 rounded-lg bg-green-50 hover:bg-green-100 text-green-800 text-sm border border-green-200 transition"
                  onClick={() => {
                    setPickupDate(preset.date);
                    setPickupStartTime(preset.start);
                    setPickupEndTime(preset.end);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pickup Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label className="block mb-1 font-medium">Date de Ramassage *</label>
              <input
                type="date"
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200"
                value={pickupDate}
                onChange={e => setPickupDate(e.target.value)}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <label className="block mb-1 font-medium">Heure de Début *</label>
              <input
                type="time"
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200"
                value={pickupStartTime}
                onChange={e => setPickupStartTime(e.target.value)}
                required
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <label className="block mb-1 font-medium">Heure de Fin *</label>
              <input
                type="time"
                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200"
                value={pickupEndTime}
                onChange={e => setPickupEndTime(e.target.value)}
                required
              />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading
                ? t("provider.rapid_offer.form.submitting") || "Posting..."
                : t("provider.rapid_offer.form.submit") || "Post Offer"}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </main>
  );
};

export default RapidOffer;
