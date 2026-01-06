"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Trash2, AlertTriangle, CheckCircle, Mail, Send } from "lucide-react";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "react-hot-toast";

const DataDeletionPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes("@")) {
      toast.error(t("data_deletion.invalid_email"));
      return;
    }

    setLoading(true);
    try {
      // Try to send deletion request via backend
      const token = localStorage.getItem("accessToken");
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      try {
        await axiosInstance.post(
          `/users/request-deletion`,
          { email: email.trim() },
          { headers }
        );
        setSubmitted(true);
        toast.success(t("data_deletion.request_sent"));
      } catch (backendError: any) {
        // If backend endpoint doesn't exist, use email as fallback
        if (backendError?.response?.status === 404) {
          const subject = encodeURIComponent(t("data_deletion.email_subject"));
          const body = encodeURIComponent(
            t("data_deletion.email_body_template", { email: email.trim() })
          );
          window.location.href = `mailto:savetheplatetunisia@gmail.com?subject=${subject}&body=${body}`;
          setSubmitted(true);
          toast.success(t("data_deletion.email_opened"));
        } else {
          throw backendError;
        }
      }
    } catch (error: any) {
      console.error("Error submitting deletion request:", error);
      toast.error(t("data_deletion.error") || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="flex flex-col items-center w-full min-h-screen bg-gray-50">
        <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl pt-8 sm:pt-12 pb-12">
          <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-100 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("data_deletion.success.title")}
            </h1>
            <p className="text-gray-700 leading-relaxed">
              {t("data_deletion.success.message")}
            </p>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-emerald-800">
                {t("data_deletion.success.timeline")}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ← {t("common.back")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center w-full min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-4 sm:px-6 max-w-2xl pt-8 sm:pt-12 pb-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#344e41]">
            {t("data_deletion.title")}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {t("data_deletion.subtitle")}
          </p>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-900">
                {t("data_deletion.warning.title")}
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                {t("data_deletion.warning.content")}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100 space-y-6">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t("data_deletion.what_will_be_deleted.title")}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>{t("data_deletion.what_will_be_deleted.profile")}</li>
              <li>{t("data_deletion.what_will_be_deleted.orders")}</li>
              <li>{t("data_deletion.what_will_be_deleted.offers")}</li>
              <li>{t("data_deletion.what_will_be_deleted.preferences")}</li>
              <li>{t("data_deletion.what_will_be_deleted.analytics")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t("data_deletion.what_will_remain.title")}
            </h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>{t("data_deletion.what_will_remain.legal")}</li>
              <li>{t("data_deletion.what_will_remain.aggregate")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              {t("data_deletion.how_to_request.title")}
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {t("data_deletion.how_to_request.content")}
            </p>
          </section>

          {/* Request Form */}
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t("data_deletion.request_form.title")}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {t("data_deletion.request_form.email_label")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder={t("data_deletion.request_form.email_placeholder")}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t("data_deletion.request_form.submitting")}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("data_deletion.request_form.submit")}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Alternative Method */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {t("data_deletion.alternative.title")}
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed mb-3">
              {t("data_deletion.alternative.content")}
            </p>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>{t("data_deletion.alternative.email")}:</strong>{" "}
                <a href="mailto:savetheplatetunisia@gmail.com" className="text-emerald-600 hover:text-emerald-700">
                  savetheplatetunisia@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← {t("common.back")}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default DataDeletionPage;

