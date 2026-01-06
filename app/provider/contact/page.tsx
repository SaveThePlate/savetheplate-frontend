"use client";

import React, { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Mail, MapPin, Send, MessageSquare, User, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { useUser } from "@/context/UserContext";

const ContactPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { userRole, user } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({
        ...prev,
        email: user.email,
        name: user.username || prev.name,
      }));
    }
  }, [user?.email, user?.username]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset messages
    setError(null);
    setSuccess(false);
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError(t("contact.fill_required") || "Please fill in all required fields.");
      return;
    }

    if (!formData.email.includes("@")) {
      setError(t("contact.valid_email") || "Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      // Try to send via backend if endpoint exists
      const token = localStorage.getItem("accessToken");
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Get user ID if logged in
      let userId: number | undefined = undefined;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          userId = payload.id;
        } catch (err) {
          console.error("Failed to parse token:", err);
        }
      }

      // Attempt to send via backend contact endpoint
      try {
        await axiosInstance.post(
          `/contact`,
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            subject: formData.subject.trim() || t("contact.email_subject_default"),
            message: formData.message.trim(),
            userRole: userRole || "GUEST",
            userId: userId,
          },
          { headers }
        );
        setFormData({ name: "", email: "", subject: "", message: "" });
        setSuccess(true);
        setError(null);
      } catch (backendError: any) {
        // If backend endpoint doesn't exist, use mailto as fallback
        if (backendError?.response?.status === 404) {
          const subject = encodeURIComponent(
            formData.subject || t("contact.email_subject_default")
          );
          const body = encodeURIComponent(
            t("contact.email_body_template", {
              name: formData.name,
              email: formData.email,
              message: formData.message
            })
          );
          window.location.href = `mailto:savetheplatetunisia@gmail.com?subject=${subject}&body=${body}`;
        } else {
          throw backendError;
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMsg = sanitizeErrorMessage(error, {
        action: "send message",
        defaultMessage: t("contact.send_failed") || "Unable to send message. Please try again or email us directly."
      });
      setError(errorMsg);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/provider/profile")}
          className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center hover:bg-emerald-50 transition-colors"
        >
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="font-display font-bold text-lg sm:text-xl md:text-2xl mb-1">{t("contact.title")}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Contact Information Cards */}
        <div className="lg:col-span-1 space-y-3">
          <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">{t("contact.email")}</h3>
                <a
                  href="mailto:savetheplatetunisia@gmail.com"
                  className="text-primary hover:text-primary/80 text-xs sm:text-sm"
                >
                  savetheplatetunisia@gmail.com
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">{t("contact.location")}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("contact.location_address")}
                </p>
              </div>
            </div>
          </div>

          {/* Response Time Info */}
          <div className="bg-white rounded-xl p-4 border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold">{t("contact.response_time")}</h3>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t("contact.response_time_message")}
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-border shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              {t("contact.send_message")}
            </h2>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm text-emerald-800">
                  {t("contact.send_success") || "Message sent successfully! We'll get back to you soon."}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-xs sm:text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-[10px] sm:text-xs md:text-sm font-medium mb-1.5"
                >
                  {t("contact.name")} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 md:py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs sm:text-sm"
                    placeholder={t("contact.name_placeholder")}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] sm:text-xs md:text-sm font-medium mb-1.5"
                >
                  {t("contact.email")} <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 md:py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs sm:text-sm"
                    placeholder={t("contact.email_placeholder")}
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-[10px] sm:text-xs md:text-sm font-medium mb-1.5"
                >
                  {t("contact.subject")}
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 sm:py-2.5 md:py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-xs sm:text-sm"
                  placeholder={t("contact.subject_placeholder")}
                />
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-[10px] sm:text-xs md:text-sm font-medium mb-1.5"
                >
                  {t("contact.message")} <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 sm:py-3 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all text-sm"
                  placeholder={t("contact.message_placeholder")}
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                  {t("contact.characters", { count: formData.message.length })}
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 sm:py-2.5 md:py-3 px-4 sm:px-6 rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t("contact.sending")}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t("contact.send_message_button")}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

