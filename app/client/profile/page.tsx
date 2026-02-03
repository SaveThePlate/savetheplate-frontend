"use client";

import React, { useEffect, useState, useMemo } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { sanitizeImageUrl, shouldUnoptimizeImage } from "@/utils/imageUtils";
import { User, Settings, CreditCard, HelpCircle, ChevronRight, LogOut, Store, Leaf, ShoppingBag, Award, Clock, Heart, MessageCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const DEFAULT_PROFILE_IMAGE = "/logo.png";

interface Order {
  id: number;
  quantity: number;
  offerId: number;
  status: string;
  createdAt: string;
  collectedAt?: string;
  offer?: {
    originalPrice?: number;
    price?: number;
  };
}

interface UserData {
    id: number;
    username: string;
  email: string;
    profileImage?: string;
  role?: string;
}


const ProfilePage = () => {
  const router = useRouter();
  const { t } = useLanguage();
  const { user: contextUser, loading: userLoading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  useEffect(() => {
    const run = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsAuthenticated(false);
          setOrdersLoading(false);
          router.push("/signIn");
          return;
        }

        // Use user data from context; if not available yet, wait
        if (!contextUser) {
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const userId = contextUser.id;

        // Fetch only orders (user data comes from context)
        const ordersRes = await axiosInstance.get(`/orders/user/${userId}`, { headers });
        setOrders(ordersRes.data || []);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        setIsAuthenticated(false);
        router.push("/signIn");
      } finally {
        setOrdersLoading(false);
      }
    };

    if (userLoading) {
      return; // Wait for user context to load
    }

    run();
  }, [contextUser, userLoading, router]);

  // Calculate impact metrics - orders that are confirmed and have been collected
  // Memoize to avoid recalculating on every render
  const { mealsSaved, co2Saved, moneySaved } = useMemo(() => {
    const collectedOrders = orders.filter(o => o.status === "confirmed" && o.collectedAt) || [];
    const meals = collectedOrders.length;
    const co2 = meals * 2.5; // Approximate kg CO2 per meal saved
    const money = collectedOrders.reduce((sum, order) => {
      const originalPrice = order.offer?.originalPrice || 0;
      const price = order.offer?.price || 0;
      if (originalPrice > price && originalPrice > 0) {
        const saved = (originalPrice - price) * order.quantity;
        return sum + saved;
      }
      return sum;
    }, 0);

    return { mealsSaved: meals, co2Saved: co2, moneySaved: money };
  }, [orders]);

  // Redirect will be handled by useEffect, but show loading while redirecting
  if (!isAuthenticated && !ordersLoading && !userLoading) {
    return null;
  }

  if (ordersLoading || userLoading || !contextUser) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayName = contextUser.username || contextUser.email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-transparent backdrop-blur-md border-b border-border/50 px-4 py-4">
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-foreground">
          {t("profile.title") || "Profile"}
        </h1>
      </header>

      <div className="px-3 sm:px-4 pt-4 sm:pt-6 space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center text-emerald-600 text-xl sm:text-2xl font-bold overflow-hidden flex-shrink-0 border-2 border-emerald-100">
              {contextUser.profileImage && contextUser.profileImage !== DEFAULT_PROFILE_IMAGE ? (
                <Image 
                  src={sanitizeImageUrl(contextUser.profileImage)} 
                  alt={displayName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                  unoptimized={shouldUnoptimizeImage(contextUser.profileImage)}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = DEFAULT_PROFILE_IMAGE;
                  }}
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-lg sm:text-xl text-foreground truncate">{displayName}</h2>
              <p className="text-muted-foreground text-xs sm:text-sm truncate">{contextUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                <p className="text-xs font-medium text-emerald-600">
                  {contextUser.role === "PROVIDER" ? "Provider" : "Customer"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Stats */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm sm:text-base px-1">
            {t("profile.impact") || "Your Impact"}
          </h3>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 sm:p-4 border border-emerald-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center mb-2 flex-shrink-0">
                <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-emerald-900">{mealsSaved}</div>
              <div className="text-[10px] sm:text-xs text-emerald-700 font-medium mt-1">
                {t("profile.mealsSaved") || "Meals Saved"}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-4 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-2 flex-shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-blue-900">{co2Saved.toFixed(1)}</div>
              <div className="text-[10px] sm:text-xs text-blue-700 font-medium mt-1">
                {t("profile.co2Saved") || "kg CO₂"}
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3 sm:p-4 border border-amber-200/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2 flex-shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-amber-900">{moneySaved.toFixed(2)}</div>
              <div className="text-[10px] sm:text-xs text-amber-700 font-medium mt-1">
                {t("profile.moneySaved") || "dt Saved"}
              </div>
            </div>
          </div>
        </div>

        {/* Pending Provider Status */}
        {contextUser.role === "PENDING_PROVIDER" && (
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-sm">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-amber-600 flex items-center justify-center text-white flex-shrink-0">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-amber-900 text-sm sm:text-base">
                {t("profile.pendingProvider") || "Pending to become a provider"}
              </p>
              <p className="text-[11px] sm:text-xs text-amber-800 mt-1 opacity-80">
                {t("profile.pendingProviderDesc") || "Your request is being reviewed. You'll be notified once approved."}
              </p>
            </div>
          </div>
        )}

        {/* Menu Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm sm:text-base px-1">
            {t("profile.account") || "Account"}
          </h3>
          <div className="space-y-2">
            <Link href="/client/profile/account-details" className="block">
              <MenuItem icon={User} label={t("profile.accountDetails") || "Account Details"} />
            </Link>
            <Link href="/client/profile/payment-methods" className="block">
              <MenuItem icon={CreditCard} label={t("profile.paymentMethods") || "Payment Methods"} />
            </Link>
            <Link href="/client/profile/preferences" className="block">
              <MenuItem icon={Settings} label={t("common.preferences") || "Preferences"} />
            </Link>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-foreground text-sm sm:text-base px-1">
            {t("profile.discover") || "Discover"}
          </h3>
          <div className="space-y-2">
            <Link href="/client/impact" className="block">
              <MenuItem icon={Heart} label={t("nav.impact") || "Your Impact"} />
            </Link>
            <Link href="/client/contact" className="block">
              <MenuItem icon={MessageCircle} label={t("nav.contact") || "Contact Us"} />
            </Link>
            <Link href="/client/profile/help-support" className="block">
              <MenuItem icon={HelpCircle} label={t("profile.helpSupport") || "Help & Support"} />
            </Link>
          </div>
        </div>

        {contextUser.role === "PROVIDER" && (
          <Link href="/provider/home" className="block">
            <MenuItem icon={Store} label={t("profile.providerDashboard") || "Provider Dashboard"} />
          </Link>
        )}

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full flex items-center justify-center gap-3 bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 mt-4 sm:mt-6"
          size="lg"
        >
          <LogOut className="w-5 h-5" />
          {t("common.signOut") || "Sign Out"}
        </Button>

        {/* Version Info */}
        <div className="mt-8 sm:mt-12 text-center">
          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">
            {t("profile.version") || "Version"} 2.4.0 (Build 182)
          </p>
        </div>
      </div>
    </div>
  );
};

function MenuItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <Button 
      onClick={onClick}
      variant="outline"
      className="w-full flex items-center justify-between px-4 py-3 sm:py-4 bg-white hover:bg-emerald-50 border-border/50 hover:border-emerald-200 group transition-all duration-200"
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors flex-shrink-0">
          <Icon size={20} />
        </div>
        <span className="font-medium text-sm sm:text-base text-foreground">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground group-hover:text-emerald-600 transition-colors flex-shrink-0" />
    </Button>
  );
}

export default ProfilePage;