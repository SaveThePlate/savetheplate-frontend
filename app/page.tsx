"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Leaf, 
  DollarSign, 
  MapPin, 
  Clock, 
  Heart,
  ShoppingBag,
  Store,
  TrendingUp,
  CheckCircle2
} from "lucide-react";

// Lazy load CarbonFootprint component as it's below the fold
const CarbonFootprint = dynamic(() => import("@/components/CarbonFootprint"), {
  loading: () => <div className="h-32 animate-pulse bg-gray-200 rounded-lg" />,
  ssr: false, // This component doesn't need SSR
});

const WelcomePage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const { user, userRole, loading: userLoading, fetchUserRole } = useUser();

  // Check if user is already authenticated on page load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setCheckingAuth(false);
        return;
      }

      try {
        // Ensure context is populated (single session bootstrap: `/users/me`)
        if (!userLoading && !userRole) {
          await fetchUserRole();
        }

        // Landing page behavior:
        // - CLIENT: go straight to client home
        // - PROVIDER / PENDING_PROVIDER: go to provider home
        // - NONE: stay on landing page
        if (userRole === "CLIENT") {
          router.push("/client/home");
          return;
        }
        if (userRole === "PROVIDER" || userRole === "PENDING_PROVIDER") {
          router.push("/provider/home");
          return;
        }
        setCheckingAuth(false);
      } catch (error) {
        // Token is invalid or expired, stay on landing page
        console.debug("Token check failed, staying on landing page");
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router, user, userRole, userLoading, fetchUserRole]);

  const handleGetStarted = () => {
    // Clear all tokens and localStorage to start fresh onboarding
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refresh-token");
    localStorage.removeItem("remember");
    // Redirect to signIn page to start the onboarding process from the beginning
    router.push("/signIn");
  };

  const handleSignIn = () => {
    // Keep existing session and redirect to signIn
    // The signIn page will handle redirecting users based on their current state
    router.push("/signIn");
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FAF5] via-[#F0F7F4] to-[#E8F4EE] overflow-x-hidden">
      {/* Language Switcher - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="button" />
      </div>

      {/* Compact Logo Header */}
      <div className="w-full flex justify-center items-center pt-2 pb-0 px-4 sm:px-6">
        <div className="group cursor-pointer transition-transform duration-300 hover:scale-105">
          <Image
            src="/logo.png"
            alt="Save The Plate"
            width={150}
            height={150}
            className="object-contain drop-shadow-xl sm:w-48 sm:h-48 md:w-56 md:h-56"
            priority
          />
        </div>
      </div>

      {/* Hero Section - Compact Design */}
      <section className="relative pt-2 pb-8 sm:pt-4 sm:pb-12 lg:pt-6 lg:pb-16 px-4 sm:px-6 lg:px-8">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-30 -z-10" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl opacity-25 -z-10" />

        <div className="w-full mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-center">
            {/* Left: Content - Takes 3 columns */}
            <div className="lg:col-span-3 text-center lg:text-left space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-foreground leading-tight">
                {t("landing.welcome_title")}{" "}
                <span className="text-primary bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  {t("landing.welcome_subtitle")}
                </span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                {t("landing.welcome_description")}
              </p>

              {/* CTA Buttons - Inline */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
                <Button
                  onClick={handleGetStarted}
                  variant="emerald"
                  size="lg"
                  className="group bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 shadow-lg hover:shadow-xl transform hover:scale-105 font-bold"
                >
                  {t("landing.get_started")}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  onClick={() => router.push("/business-signup")}
                  variant="outline"
                  size="lg"
                  className="group bg-amber-50/90 backdrop-blur-sm hover:bg-amber-100 text-amber-700 hover:text-amber-800 border-2 border-amber-300 hover:border-amber-400 shadow-md hover:shadow-lg transform hover:scale-105 font-bold"
                >
                  <Store className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {t("landing.register_business")}
                </Button>
              </div>
              
              {/* Sign In Link */}
              <div className="mt-3 text-center lg:text-left">
                <button
                  onClick={handleSignIn}
                  className="text-sm text-gray-600 hover:text-primary transition-colors underline underline-offset-4"
                >
                  {t("landing.already_member")} {t("landing.sign_in")}
                </button>
              </div>
            </div>

            {/* Right: Illustration - Takes 2 columns, more compact */}
            <div className="lg:col-span-2 relative flex items-center justify-center min-h-[400px]">
              {/* Decorative background circles */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-64 h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl opacity-60 animate-pulse" />
                <div className="absolute w-48 h-48 bg-gradient-to-tr from-accent/30 to-primary/30 rounded-full blur-2xl opacity-40" style={{ animationDelay: '1s' }} />
              </div>
              
              {/* Image container with shadow and styling */}
              <div className="relative z-10 p-6 rounded-3xl bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm shadow-2xl">
                <Image
                  src="/newlander.png"
                  width={350}
                  height={350}
                  alt={t("landing.illustration_alt")}
                  className="animate-float w-auto h-auto max-w-full drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - More Compact */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="w-full mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] mb-3">
              {t("landing.why_choose")}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              {t("landing.why_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Feature 1 */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border-2 border-primary/20 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.save_money_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.save_money_desc")}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-5 border-2 border-accent/20 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                <Leaf className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.save_planet_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.save_planet_desc")}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-amber-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.support_local_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.support_local_desc")}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-blue-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.quick_easy_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.quick_easy_desc")}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border-2 border-pink-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-pink-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.make_difference_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.make_difference_desc")}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                <ShoppingBag className="w-6 h-6 text-purple-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.surprise_packs_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.surprise_packs_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - More Compact */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <div className="w-full mx-auto max-w-7xl">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] mb-3">
              {t("landing.how_it_works")}
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              {t("landing.how_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-primary/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.step1_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.step1_desc")}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-primary/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.step2_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.step2_desc")}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-primary/20 text-center">
              <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t("landing.step3_title")}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t("landing.step3_desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Providers Section - More Compact */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full mx-auto max-w-7xl">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl p-6 sm:p-8 lg:p-10 text-white shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 mb-4">
                  <Store className="w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold">{t("landing.for_business")}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                  {t("landing.list_surplus")}
                </h2>
                <p className="text-base sm:text-lg mb-5 opacity-90">
                  {t("landing.business_desc")}
                </p>
                <ul className="space-y-2 mb-5">
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>{t("landing.business_benefit1")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>{t("landing.business_benefit2")}</span>
                  </li>
                  <li className="flex items-center gap-2 text-sm sm:text-base">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>{t("landing.business_benefit3")}</span>
                  </li>
                </ul>
                <Button
                  onClick={() => router.push("/business-signup")}
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100 font-bold shadow-lg group"
                >
                  <Store className="w-5 h-5 mr-2" />
                  {t("landing.register_business")}
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="hidden lg:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border-2 border-white/20">
                  <TrendingUp className="w-16 h-16 sm:w-20 sm:h-20 mx-auto opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carbon Footprint Section - More Compact */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="w-full mx-auto max-w-2xl">
          <CarbonFootprint />
        </div>
      </section>

      {/* Final CTA - More Compact */}
      <section className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F9FAF5] via-[#F0F7F4] to-[#E8F4EE]">
        <div className="w-full mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B4332] mb-3">
            {t("landing.ready_title")}
          </h2>
          <p className="text-base sm:text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            {t("landing.ready_desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Button
              onClick={handleGetStarted}
              variant="emerald"
              size="lg"
              className="shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              {t("landing.get_started_now")}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            {/* <Button
              onClick={() => router.push("/business-signup")}
              variant="outline"
              size="lg"
              className="bg-white/90 hover:bg-white text-amber-700 border-2 border-amber-300 hover:border-amber-400 shadow-md hover:shadow-lg group"
            >
              <Store className="w-5 h-5 mr-2" />
              {t("landing.for_business")}
            </Button> */}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default WelcomePage;
