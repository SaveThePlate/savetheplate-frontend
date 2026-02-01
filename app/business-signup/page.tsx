"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReloadIcon } from "@radix-ui/react-icons";
import { axiosInstance } from "@/lib/axiosInstance";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeErrorMessage } from "@/utils/errorUtils";
import { LocalStorage } from "@/lib/utils";
import { Home, CheckCircle2, DollarSign, Users, Leaf } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { getPostAuthRedirect } from "@/lib/authRedirect";

export default function BusinessSignUp() {
  const { t } = useLanguage();
  const router = useRouter();
  const { user, userRole, loading: userLoading, fetchUserRole } = useUser();

  const normalizePhoneNumber = (value: string) => value.replace(/\D/g, "");

  // Form state - only essential fields for quick onboarding
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        if (!userLoading && !userRole) {
          await fetchUserRole();
        }

        // Allow users with no role (unverified email) to stay on business signup page
        // They may have signed up as CLIENT but want to switch to PROVIDER signup
        if (!userRole || userRole === "NONE") {
          setCheckingAuth(false);
          return;
        }

        // If user already has CLIENT role, redirect to client home
        if (userRole === "CLIENT") {
          router.push("/client/home");
          return;
        }

        // If user already has PROVIDER/PENDING_PROVIDER role, redirect to provider home
        if (userRole === "PROVIDER" || userRole === "PENDING_PROVIDER") {
          router.push("/provider/home");
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        console.debug("Token check failed, showing sign up form");
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, user, userRole, userLoading, fetchUserRole]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, businessType: value }));
  };

  const validateForm = () => {
    const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
    
    if (!formData.businessName.trim()) {
      setErrorMessage(t("business_signup.error_generic") || "Business name is required");
      return false;
    }
    if (!formData.email.includes('@')) {
      setErrorMessage("Please enter a valid email address");
      return false;
    }
    if (!normalizedPhone) {
      setErrorMessage(t("business_signup.error_phone_invalid") || "Phone number is required");
      return false;
    }
    if (normalizedPhone.length < 8 || normalizedPhone.length > 15) {
      setErrorMessage(t("business_signup.error_phone_invalid") || "Invalid phone number");
      return false;
    }
    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage(t("business_signup.error_passwords_match") || "Passwords do not match");
      return false;
    }
    if (!termsAccepted) {
      setErrorMessage(t("business_signup.error_terms") || "You must accept the terms of use");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const normalizedPhone = normalizePhoneNumber(formData.phoneNumber);
      
      // First, sign up the user with PROVIDER role intent
      const signupResponse = await axiosInstance.post(
        `/auth/signup`,
        {
          email: formData.email,
          phoneNumber: normalizedPhone,
          password: formData.password,
          username: formData.businessName, // Use business name as username
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (signupResponse.data?.accessToken && signupResponse.data?.refreshToken) {
        // Store tokens
        LocalStorage.setItem("refresh-token", signupResponse.data.refreshToken);
        LocalStorage.setItem("accessToken", signupResponse.data.accessToken);
        LocalStorage.removeItem("remember");

        const token = signupResponse.data.accessToken;

        // Set role to PROVIDER (will become PENDING_PROVIDER)
        await axiosInstance.post(
          `/users/set-role`,
          { role: "PROVIDER" },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            } 
          }
        );

        // User can complete their profile with phone, address, maps link, etc. later

        // Show success message
        setShowSuccess(true);
        
        // Redirect to provider home page after 2 seconds
        const redirectTimeout = setTimeout(() => {
          router.push("/provider/home");
        }, 2000);

        // Store timeout ID for cleanup if component unmounts
        return () => clearTimeout(redirectTimeout);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Business signup error:", err);
      
      const userMessage = sanitizeErrorMessage(err, {
        action: "create business account",
        defaultMessage: t("business_signup.error_generic") || "Unable to create account. Please try again.",
        t: t
      });
      
      setErrorMessage(userMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-x-hidden">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-emerald-200 rounded-full" />
            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground text-sm font-medium">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // Show success screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-x-hidden flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl border border-border/50 p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            {t("business_signup.success_title")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("business_signup.success_message")}
          </p>
          <div className="animate-pulse">
            <p className="text-sm text-muted-foreground">
              {t("common.loading")}...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation Header - Match Landing Page */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo */}
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="Save The Plate"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-lg font-bold text-[#1B4332] hidden sm:block">SaveThePlate</span>
            </button>
            
            {/* Center - Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <a href="/#features" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.fun_header_badge")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#how-it-works" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.how_it_works")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="/#business" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.for_business")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
            
            {/* Right side - Language Switcher */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="button" />
            </div>
          </div>
        </div>
      </nav>

      <div className="w-full bg-gradient-to-br from-white via-emerald-50/30 to-white min-h-screen pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] mb-4 leading-tight">
              {t("business_signup.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mb-2 leading-relaxed max-w-xl mx-auto">
              {t("business_signup.subtitle")}
            </p>
            <p className="text-xs sm:text-sm text-emerald-600 font-medium">
              {t("business_signup.quick_signup_subtitle")}
            </p>
          </div>

        {/* Benefits Section */}
        <div className="mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-[#1B4332] mb-8 text-center">
            {t("business_signup.benefits_title")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-emerald-100/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-200/80">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Leaf className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1B4332] text-base mb-2">{t("business_signup.benefit1")}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{t("business_signup.benefit1_desc") || ""}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-200/80">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1B4332] text-base mb-2">{t("business_signup.benefit2")}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{t("business_signup.benefit2_desc") || ""}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-200/80">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1B4332] text-base mb-2">{t("business_signup.benefit3")}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{t("business_signup.benefit3_desc") || ""}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-emerald-100/50 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-emerald-200/80">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#1B4332] text-base mb-2">{t("business_signup.benefit4")}</p>
                  <p className="text-gray-600 text-xs leading-relaxed">{t("business_signup.benefit4_desc") || ""}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-white rounded-2xl shadow-2xl border border-border/50 p-6 sm:p-8">
          {/* <h2 className="text-2xl font-bold text-foreground mb-6">
            {t("business_signup.form_title")}
          </h2> */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Business Name */}
            <div className="space-y-2">
              <label htmlFor="businessName" className="block text-sm font-semibold text-foreground">
                {t("business_signup.business_name")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="businessName"
                name="businessName"
                placeholder={t("business_signup.business_name_placeholder")}
                className="w-full px-4 py-3 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all"
                type="text"
                required
                value={formData.businessName}
                onChange={handleInputChange}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-foreground">
                {t("business_signup.email")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                name="email"
                placeholder={t("business_signup.email_placeholder")}
                className="w-full px-4 py-3 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label htmlFor="phoneNumber" className="block text-sm font-semibold text-foreground">
                {t("business_signup.phone")} <span className="text-red-500">*</span>
              </label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder={t("business_signup.phone_placeholder")}
                className="w-full px-4 py-3 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all"
                type="tel"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-foreground">
                  {t("business_signup.password")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="password"
                  name="password"
                  placeholder={t("business_signup.password_placeholder")}
                  className="w-full px-4 py-3 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all"
                  type="password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-foreground">
                  {t("business_signup.confirm_password")} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder={t("business_signup.confirm_password")}
                  className="w-full px-4 py-3 text-base border-2 border-border rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white transition-all"
                  type="password"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Info box about completing profile later */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800">
                <strong>✨ Quick Start:</strong> {t("business_signup.quick_start_hint")}
              </p>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50/50 rounded-xl">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                className="mt-1"
              />
              <label htmlFor="terms" className="text-sm text-foreground cursor-pointer">
                {t("business_signup.terms")} <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            {loading ? (
              <Button
                disabled
                className="w-full bg-emerald-600 text-white font-semibold py-4 rounded-xl flex justify-center items-center text-base shadow-lg"
              >
                <ReloadIcon className="mr-2 h-5 w-5 animate-spin" />
                {t("business_signup.submitting")}
              </Button>
            ) : (
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-base transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("business_signup.submit")}
              </Button>
            )}

            {/* Sign In Link */}
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                {t("business_signup.already_have_account")}{" "}
                <button
                  type="button"
                  onClick={() => router.push("/signIn")}
                  className="text-emerald-600 hover:text-emerald-700 font-semibold"
                >
                  {t("business_signup.sign_in_here")}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
    </div>
  );
}

