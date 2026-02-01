"use client";
import React, { useState, useEffect, useRef } from "react";
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
  MapPin, 
  Clock, 
  Heart,
  ShoppingBag,
  Store,
  CheckCircle2,
  Users,
  Globe,
  TrendingUp,
  Star,
  Zap,
  Shield,
  Target
} from "lucide-react";

// Lazy load CarbonFootprint component as it's below the fold
const CarbonFootprint = dynamic(() => import("@/components/CarbonFootprint"), {
  loading: () => <div className="h-32 animate-pulse bg-gray-200 rounded-xl" />,
  ssr: false,
});

// Animated Section Component
const AnimatedSection = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "-50px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 transform ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-12"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

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
        if (!userLoading && !userRole) {
          await fetchUserRole();
        }
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
        console.debug("Token check failed, staying on landing page");
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router, user, userRole, userLoading, fetchUserRole]);

  const handleGetStarted = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refresh-token");
    localStorage.removeItem("remember");
    router.push("/signIn");
  };

  const handleSignIn = () => {
    router.push("/signIn");
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo */}
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Save The Plate"
                width={36}
                height={36}
                className="object-contain"
              />
              <span className="text-lg font-bold text-[#1B4332] hidden sm:block">SaveThePlate</span>
            </div>
            
            {/* Center - Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.fun_header_badge")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.how_it_works")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
              <a href="#business" className="text-gray-600 hover:text-primary transition-colors font-medium relative group">
                {t("landing.for_business")}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </a>
            </div>
            
            {/* Right side - Language Switcher and Sign In */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher variant="button" />
              <Button
                onClick={handleSignIn}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white shadow-sm"
              >
                {t("landing.sign_in")}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Background Image */}
      <section className="relative pt-0 pb-0 overflow-hidden min-h-screen flex items-center mt-16">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/cover2.png"
            alt="Hero background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332]/95 via-[#1B4332]/85 to-[#2D5A47]/90" />
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20 sm:py-0">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-white space-y-3 sm:space-y-4 lg:space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium mb-3 sm:mb-4 border border-white/20">
                  <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                  <span>{t("landing.badge_text")}</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
                  {t("landing.welcome_title")}
                  <span className="block text-emerald-300 mt-1 sm:mt-1.5 bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                    {t("landing.welcome_subtitle")}
                  </span>
                </h1>
              </div>
              
              <div>
                <p className="text-xs sm:text-sm lg:text-base text-white/90 leading-relaxed max-w-xl">
                  {t("landing.welcome_description")}
                </p>
              </div>
              
              <div>
                <div className="flex gap-2.5 pt-2">
                  <Button
                    onClick={handleGetStarted}
                    className="flex-1 sm:flex-none bg-white text-[#1B4332] hover:bg-gray-100 font-bold shadow-lg transition-all duration-200 py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-xs sm:text-sm"
                  >
                    {t("landing.get_started")}
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-1.5 sm:ml-2" />
                  </Button>
                  <Button
                    onClick={() => router.push("/business-signup")}
                    variant="outline"
                    className="flex-1 sm:flex-none bg-white/10 text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50 font-bold backdrop-blur-sm transition-all duration-200 py-2 px-4 sm:py-3 sm:px-6 rounded-lg text-xs sm:text-sm"
                  >
                    <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                    {t("landing.register_business")}
                  </Button>
                </div>
              </div>

            </div>

            {/* Right Image - App Preview - Mobile & Desktop */}
            <div className="relative mt-6 sm:mt-8 lg:mt-0 flex justify-center">
              <div className="relative w-[240px] sm:w-[300px] md:w-[360px] lg:w-full max-w-md lg:max-w-lg xl:max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 to-teal-400/30 rounded-[3rem] blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
                <Image
                  src="/phone1.png"
                  alt="App preview"
                  width={600}
                  height={1200}
                  sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, (max-width: 1024px) 380px, 600px"
                  className="relative z-10 object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.4)] hover:scale-105 transition-transform duration-700"
                  priority
                />
                
                {/* Floating Cards - Overlay on image */}
                <AnimatedSection delay={500} className="absolute top-1/4 -left-6 sm:-left-12 md:-left-8 lg:-left-12 z-20">
                  <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3 animate-float border border-emerald-100 w-max">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center flex-shrink-0">
                      <Leaf className="w-4 h-4 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-sm font-bold text-[#1B4332]">-70% CO₂</p>
                      <p className="text-[8px] sm:text-xs text-gray-500">par repas</p>
                    </div>
                  </div>
                </AnimatedSection>
                
                <AnimatedSection delay={600} className="absolute top-1/2 -right-6 sm:-right-12 md:-right-8 lg:-right-12 z-20">
                  <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3 animate-float border border-amber-100 w-max" style={{ animationDelay: '0.5s' }}>
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-sm font-bold text-[#1B4332]">-50% Prix</p>
                      <p className="text-[8px] sm:text-xs text-gray-500">invendus</p>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section id="features" className="relative py-8 sm:py-12 lg:py-20 xl:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-white">
        <div className="max-w-[1600px] mx-auto">
          {/* Large Desktop Image Container */}
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px]">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl" />
            
            {/* Desktop Image - Much Bigger */}
            <div className="relative w-full h-full flex items-center justify-center">
              <div className="relative w-[90%] md:w-[85%] lg:w-[80%] xl:w-[75%] h-full">
                <Image
                  src="/desktop.png"
                  alt="App home screen"
                  fill
                  sizes="(max-width: 768px) 90vw, (max-width: 1200px) 85vw, 75vw"
                  className="object-contain drop-shadow-[0_50px_100px_rgba(0,0,0,0.25)] hover:scale-[1.02] transition-transform duration-700"
                  priority
                />
              </div>
            </div>

            {/* Floating Content Overlay - Top Right */}
            <AnimatedSection className="absolute top-3 right-1.5 sm:top-6 sm:right-4 md:top-12 md:right-12 lg:top-20 lg:right-24 max-w-[150px] sm:max-w-xs md:max-w-md z-10">
              <div className="backdrop-blur-xl bg-white/90 rounded-lg sm:rounded-2xl lg:rounded-3xl p-2 sm:p-4 md:p-6 shadow-xl border border-white/50">
                <h2 className="text-[11px] sm:text-sm md:text-lg lg:text-2xl xl:text-3xl font-bold text-[#1B4332] leading-tight mb-1 sm:mb-2 md:mb-3">
                  Une application simple et <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">intuitive</span>
                </h2>
                <p className="text-[9px] sm:text-xs md:text-sm lg:text-base text-gray-600 leading-snug">
                  Découvre les meilleures offres près de chez toi en quelques clics. 
                  Parcourt, réserve et récupère tes repas en toute simplicité.
                </p>
              </div>
            </AnimatedSection>

            {/* Floating Feature Cards - Bottom Left */}
            <div className="absolute bottom-3 left-1.5 sm:bottom-6 sm:left-4 md:bottom-12 md:left-12 lg:bottom-20 lg:left-24 space-y-1.5 sm:space-y-2 md:space-y-3 z-10 max-w-[150px] sm:max-w-xs md:max-w-sm">
              <AnimatedSection delay={200}>
                <div className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-3 md:p-4 backdrop-blur-xl bg-white/90 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-white/50">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1B4332] text-[9px] sm:text-xs md:text-sm lg:text-base truncate">Géolocalisation</p>
                    <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-600 truncate">
                      Près de chez toi
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={300}>
                <div className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-3 md:p-4 backdrop-blur-xl bg-white/90 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-white/50">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1B4332] text-[9px] sm:text-xs md:text-sm lg:text-base truncate">Réservation</p>
                    <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-600 truncate">
                      En 2 clics
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={400}>
                <div className="flex items-center gap-1.5 sm:gap-3 p-2 sm:p-3 md:p-4 backdrop-blur-xl bg-white/90 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-white/50">
                  <div className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-3.5 h-3.5 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#1B4332] text-[9px] sm:text-xs md:text-sm lg:text-base truncate">Impact</p>
                    <p className="text-[8px] sm:text-[10px] md:text-xs text-gray-600 truncate">
                      Suis tes économies
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative py-8 sm:py-12 lg:py-20 xl:py-28 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-emerald-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-teal-200/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedSection>
            <div className="text-center mb-6 sm:mb-8 lg:mb-12">
              <div className="inline-block px-3 py-1.5 bg-emerald-100 rounded-full mb-2 sm:mb-3">
                <p className="text-emerald-700 font-semibold text-xs">{t("landing.how_it_works")}</p>
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-[#1B4332] mb-2 sm:mb-3 leading-tight px-4">
                {t("landing.how_subtitle")}
              </h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 sm:h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 mx-auto rounded-full" />
            </div>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-200 via-amber-200 to-green-200" style={{ width: 'calc(100% - 12rem)', left: '6rem' }} />
            
            <AnimatedSection delay={100}>
              <div className="relative group">
                <div className="relative bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full border border-emerald-100/50 hover:border-emerald-300 hover:-translate-y-2 overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Number badge */}
                  <div className="absolute -top-3 -left-3 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm sm:text-base md:text-xl shadow-lg z-20 ring-1.5 sm:ring-3 ring-white group-hover:scale-110 transition-transform duration-300">
                    1
                  </div>
                  
                  {/* Image container */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 mx-auto mb-4 sm:mb-6 mt-2 sm:mt-4">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-teal-400/30 rounded-full blur-xl" />
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-100 p-3 sm:p-4 group-hover:scale-110 transition-transform duration-500">
                      <Image
                        src="/step1.png"
                        alt="Browse offers"
                        fill
                        sizes="160px"
                        className="object-contain p-2 sm:p-3"
                      />
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#1B4332] mb-1 sm:mb-1.5 text-center">{t("landing.step1_title")}</h3>
                    <p className="text-gray-600 text-center leading-relaxed text-[11px] sm:text-xs md:text-sm">{t("landing.step1_desc")}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Step 2 */}
            <AnimatedSection delay={200}>
              <div className="relative group">
                <div className="relative bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full border border-amber-100/50 hover:border-amber-300 hover:-translate-y-2 overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Number badge */}
                  <div className="absolute -top-2.5 -left-2.5 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-sm sm:text-base md:text-xl shadow-lg z-20 ring-1.5 sm:ring-3 ring-white group-hover:scale-110 transition-transform duration-300">
                    2
                  </div>
                  
                  {/* Image container */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto mb-3 sm:mb-4 mt-1.5 sm:mt-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-xl" />
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100 p-2 sm:p-3 group-hover:scale-110 transition-transform duration-500">
                      <Image
                        src="/step2.avif"
                        alt="Place order"
                        fill
                        sizes="160px"
                        className="object-cover rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#1B4332] mb-1 sm:mb-1.5 text-center">{t("landing.step2_title")}</h3>
                    <p className="text-gray-600 text-center leading-relaxed text-[11px] sm:text-xs md:text-sm">{t("landing.step2_desc")}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Step 3 */}
            <AnimatedSection delay={300}>
              <div className="relative group">
                <div className="relative bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 h-full border border-green-100/50 hover:border-green-300 hover:-translate-y-2 overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Number badge */}
                  <div className="absolute -top-2.5 -left-2.5 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center font-bold text-sm sm:text-base md:text-xl shadow-lg z-20 ring-1.5 sm:ring-3 ring-white group-hover:scale-110 transition-transform duration-300">
                    3
                  </div>
                  
                  {/* Image container */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 mx-auto mb-3 sm:mb-4 mt-1.5 sm:mt-2">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full blur-xl" />
                    <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-green-100 to-emerald-100 p-2 sm:p-3 group-hover:scale-110 transition-transform duration-500">
                      <Image
                        src="/step3.avif"
                        alt="Pick up"
                        fill
                        sizes="160px"
                        className="object-cover rounded-xl"
                      />
                    </div>
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-[#1B4332] mb-1 sm:mb-1.5 text-center">{t("landing.step3_title")}</h3>
                    <p className="text-gray-600 text-center leading-relaxed text-[11px] sm:text-xs md:text-sm">{t("landing.step3_desc")}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>      

      {/* Newlander Image Section */}
      <section className="py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1B4332]/95 via-[#1B4332]/70 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1B4332]/50 to-transparent z-10" />
              <Image
                src="/newlander.png"
                alt="Save The Plate mission"
                fill
                sizes="100vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="relative z-20 p-4 sm:p-6 md:p-10 lg:p-16 max-w-2xl">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3">
                  Sauvez la nourriture, réduisez le gaspillage alimentaire !
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-white/90 mb-4 sm:mb-6">
                  Avec Save the Plate,profite de délicieux repas à prix réduits tout en aidant à réduire le gaspillage alimentaire.
                </p>
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  className="bg-white text-[#1B4332] hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 py-2 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm"
                >
                  {t("landing.get_started")}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Carbon Footprint Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4332] mb-4">
                  Chaque geste compte pour la planète
                </h2>
                <p className="text-base text-gray-600 mb-8 leading-relaxed">
                  En sauvant des repas, vous contribuez directement à la réduction du gaspillage alimentaire et à la protection de l'environnement. Chaque repas sauvé, c'est moins de CO₂ émis et moins de ressources gaspillées.
                </p>
                <div className="flex flex-col gap-4 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-green-200 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-gray-700 font-medium">Réduction de 70% des émissions de CO₂</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-gray-700 font-medium">Économie de 1000L d'eau par repas sauvé</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-gray-700 font-medium">Moins de déchets pour les décharges</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-2xl" />
                <CarbonFootprint />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* For Business Section */}
      <section id="business" className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#1B4332] via-[#1B4332] to-[#2D5A47]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="text-white">
              <AnimatedSection>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 mb-4 sm:mb-6">
                  <Store className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-semibold">{t("landing.for_business")}</span>
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">
                  {t("landing.list_surplus")}
                </h2>
                <p className="text-sm sm:text-base text-white/80 mb-6 sm:mb-8 leading-relaxed">
                  {t("landing.business_desc")}
                </p>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                  <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl hover:bg-white/10 transition-colors">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400/30 to-green-400/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/90">{t("landing.business_benefit1")}</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl hover:bg-white/10 transition-colors">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400/30 to-green-400/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/90">{t("landing.business_benefit2")}</span>
                  </li>
                  <li className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg sm:rounded-xl hover:bg-white/10 transition-colors">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400/30 to-green-400/30 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs sm:text-sm text-white/90">{t("landing.business_benefit3")}</span>
                  </li>
                </ul>
              </AnimatedSection>
              <AnimatedSection delay={200}>
                <Button
                  onClick={() => router.push("/business-signup")}
                  size="lg"
                  className="bg-white text-[#1B4332] hover:bg-gray-100 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 py-2 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm"
                >
                  <Store className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  {t("landing.register_business")}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                </Button>
              </AnimatedSection>
            </div>
            
            <div className="relative">
              <AnimatedSection delay={300}>
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-green-500/30 flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-emerald-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">+30%</p>
                      <p className="text-white/60 text-sm">Revenus supplémentaires</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">50+</p>
                      <p className="text-white/60 text-sm">Nouveaux clients/mois</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 flex items-center justify-center mx-auto mb-4">
                        <Globe className="w-8 h-8 text-amber-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">-50%</p>
                      <p className="text-white/60 text-sm">Déchets alimentaires</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/30 to-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                        <Leaf className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-3xl font-bold text-white">100%</p>
                      <p className="text-white/60 text-sm">Engagement éco</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Partners & Supporters Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-8 sm:mb-12 lg:mb-16">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B4332] mb-2 sm:mb-3">
                {t("landing.partners_title") || "Nos Partenaires & Supporters"}
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 max-w-2xl mx-auto">
                {t("landing.partners_desc") || "Soutenus par les meilleures organisations pour sauver la planète"}
              </p>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-12 items-center justify-center">
              {/* Startup Act Logo */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow duration-300 hover:bg-gray-100">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 flex items-center justify-center">
                  <Image
                    src="/startup act logo.avif"
                    alt="Startup Act Logo"
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 font-medium text-center">
                  {t("landing.startup_act") || "Startup Act"}
                </p>
              </div>

              {/* OSTX Logo */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow duration-300 hover:bg-gray-100">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 flex items-center justify-center">
                  <Image
                    src="/logo ostx.avif"
                    alt="OSTX Logo"
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 font-medium text-center">
                  {t("landing.ostx") || "OSTX"}
                </p>
              </div>

              {/* The Dot Logo */}
              <div className="flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-gray-50 rounded-2xl hover:shadow-lg transition-shadow duration-300 hover:bg-gray-100">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 flex items-center justify-center">
                  <Image
                    src="/logo_the_dot.svg"
                    alt="The Dot Logo"
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
                <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 font-medium text-center">
                  {t("landing.the_dot") || "The Dot"}
                </p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1B4332] mb-3 sm:mb-4">
              {t("landing.ready_title")}
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-6 sm:mb-10 max-w-2xl mx-auto">
              {t("landing.ready_desc")}
            </p>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 group text-xs sm:text-sm lg:text-base px-4 sm:px-6 lg:px-8 py-2 sm:py-3"
              >
                {t("landing.get_started_now")}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1B4332] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="Save The Plate"
                  width={32}
                  height={32}
                  className="object-contain bg-white rounded-lg p-0.5"
                />
                <span className="text-lg sm:text-xl font-bold text-white">SaveThePlate</span>
              </div>
              <p className="text-xs sm:text-sm text-white/60 max-w-md">
                Sauvez la nourriture, économisez de l'argent et sauvez la planète. 
                Rejoignez notre communauté de héros du quotidien !
              </p>
            </div>
            <div>
            </div>
            <div>
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8">
            <a 
              href="https://www.facebook.com/people/Save-The-Plate/61584973505504/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a 
              href="https://www.instagram.com/savetheplate_tn/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.468 2.37c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            <a 
              href="https://www.tiktok.com/@savetheplatetn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com/company/savetheplate/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
            </div>
          </div>
          
        </div>
      </footer>

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
