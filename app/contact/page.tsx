"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mail, Phone, MapPin, Send, MessageSquare, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const ContactPage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUserRole(null);
        return;
      }
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUserRole(response.data.role);
        
        // Pre-fill email if available
        try {
          const userResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (userResponse.data?.email) {
            setFormData((prev) => ({
              ...prev,
              email: userResponse.data.email,
              name: userResponse.data.username || prev.name,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch user data:", err);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast.error(t("contact.fill_required"));
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error(t("contact.valid_email"));
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
        await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/contact`,
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            subject: formData.subject.trim() || "Contact Form Submission",
            message: formData.message.trim(),
            userRole: userRole || "GUEST",
            userId: userId,
          },
          { headers }
        );
        toast.success(t("contact.message_sent"));
        setFormData({ name: "", email: "", subject: "", message: "" });
      } catch (backendError: any) {
        // If backend endpoint doesn't exist, use mailto as fallback
        if (backendError?.response?.status === 404) {
          const subject = encodeURIComponent(
            formData.subject || "Contact Form Submission"
          );
          const body = encodeURIComponent(
            `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
          );
          window.location.href = `mailto:savetheplatetunisia@gmail.com?subject=${subject}&body=${body}`;
          toast.success(t("contact.opening_email"));
        } else {
          throw backendError;
        }
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(
        error?.response?.data?.message ||
          t("contact.send_failed")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        limit={3}
        toastClassName="bg-emerald-600 text-white rounded-xl shadow-lg border-0 px-4 py-3"
        bodyClassName="text-sm font-medium"
        progressClassName="bg-white/80"
      />

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl lg:max-w-6xl pt-6 sm:pt-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1B4332] mb-3 sm:mb-4">
            {t("contact.title")}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Contact Information Cards */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t("contact.email")}</h3>
                  <a
                    href="mailto:savetheplatetunisia@gmail.com"
                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    savetheplatetunisia@gmail.com
                  </a>
                </div>
              </div>
            </div>

            {/* <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                  <a
                    href="tel:+21612345678"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    +216 9
                  </a>
                </div>
              </div>
            </div> */}

            <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t("contact.location")}</h3>
                  <p className="text-gray-600 text-sm">
                    {t("contact.location_address")}
                  </p>
                </div>
              </div>
            </div>

            {/* Response Time Info */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200">
              <div className="flex items-center gap-3 mb-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900">{t("contact.response_time")}</h3>
              </div>
              <p className="text-sm text-emerald-700">
                {t("contact.response_time_message")}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Send className="w-6 h-6 text-emerald-600" />
                {t("contact.send_message")}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    {t("contact.name")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder={t("contact.name_placeholder")}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    {t("contact.email")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                      placeholder={t("contact.email_placeholder")}
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    {t("contact.subject")}
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    placeholder={t("contact.subject_placeholder")}
                  />
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    {t("contact.message")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-all"
                    placeholder={t("contact.message_placeholder")}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("contact.characters", { count: formData.message.length })}
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </>
  );
};

export default ContactPage;

