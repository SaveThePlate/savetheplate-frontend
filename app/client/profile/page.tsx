"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
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
  const [user, setUser] = useState<UserData | null>(null);
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_IMAGE);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
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
          setLoading(false);
          router.push("/signIn");
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };
        const userId = JSON.parse(atob(token.split(".")[1])).id;

        // Fetch profile and orders in parallel
        const [profileRes, ordersRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`, { headers }),
          axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/orders/user/${userId}`, { headers }),
        ]);

        const userData = profileRes.data || {};
        setUser(userData);
        setProfileImage(userData.profileImage || DEFAULT_PROFILE_IMAGE);
        setOrders(ordersRes.data || []);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setIsAuthenticated(false);
        // Redirect to sign in if authentication fails
        router.push("/signIn");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [router]);

  // Calculate impact metrics - orders that are confirmed and have been collected
  const collectedOrders = orders.filter(o => o.status === "confirmed" && o.collectedAt) || [];
  const mealsSaved = collectedOrders.length;
  const co2Saved = mealsSaved * 2.5; // Approximate kg CO2 per meal saved
  const moneySaved = collectedOrders.reduce((sum, order) => {
    const originalPrice = order.offer?.originalPrice || 0;
    const price = order.offer?.price || 0;
    if (originalPrice > price && originalPrice > 0) {
      const saved = (originalPrice - price) * order.quantity;
      return sum + saved;
    }
    return sum;
  }, 0);

  // Redirect will be handled by useEffect, but show loading while redirecting
  if (!isAuthenticated && !loading) {
    return null;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const displayName = user.username || user.email || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen pb-24 px-4 pt-10">
      <h1 className="font-display font-bold text-3xl mb-8">{t("profile.title") || "Profile"}</h1>

      {/* User Info */}
      <div className="bg-white rounded-2xl p-6 border border-border shadow-sm mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
          {profileImage && profileImage !== DEFAULT_PROFILE_IMAGE ? (
              <Image 
                src={sanitizeImageUrl(profileImage)} 
              alt={displayName}
              width={64}
              height={64}
              className="w-full h-full object-cover"
                unoptimized={shouldUnoptimizeImage(sanitizeImageUrl(profileImage))}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_PROFILE_IMAGE;
                }}
              />
          ) : (
            initials
                  )}
                </div>
        <div className="flex-1">
          <h2 className="font-bold text-lg sm:text-xl">{displayName}</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{user.email}</p>
        </div>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-primary to-primary/90 rounded-xl p-4 text-primary-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm">
          <Leaf className="w-6 h-6 mb-2" />
          <div className="text-2xl font-bold">{mealsSaved}</div>
          <div className="text-[10px] sm:text-xs opacity-90">{t("profile.mealsSaved") || "Meals Saved"}</div>
          </div>

        <div className="bg-gradient-to-br from-info to-info/90 rounded-xl p-4 text-info-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 shadow-sm">
          <Award className="w-6 h-6 mb-2" />
          <div className="text-2xl font-bold">{co2Saved.toFixed(1)}</div>
          <div className="text-[10px] sm:text-xs opacity-90">{t("profile.co2Saved") || "kg CO₂ Saved"}</div>
              </div>

        <div className="bg-gradient-to-br from-warning to-warning/90 rounded-xl p-4 text-warning-foreground animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 shadow-sm">
          <ShoppingBag className="w-6 h-6 mb-2" />
          <div className="text-2xl font-bold">{moneySaved.toFixed(2)} dt</div>
          <div className="text-[10px] sm:text-xs opacity-90">{t("profile.moneySaved") || "Money Saved"}</div>
              </div>
            </div>

      {/* Pending Provider Status */}
      {user.role === "PENDING_PROVIDER" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-yellow-700" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-yellow-900 text-xs sm:text-sm">{t("profile.pendingProvider") || "Pending to become a provider"}</p>
            <p className="text-[10px] sm:text-xs text-yellow-700 mt-0.5">{t("profile.pendingProviderDesc") || "Your request is being reviewed"}</p>
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="space-y-2 mb-6">
        <Link href="/client/profile/account-details" className="block">
          <MenuItem icon={User} label={t("profile.accountDetails") || "Account Details"} />
        </Link>
        <Link href="/client/profile/payment-methods" className="block">
          <MenuItem icon={CreditCard} label={t("profile.paymentMethods") || "Payment Methods"} />
        </Link>
        <Link href="/client/profile/preferences" className="block">
          <MenuItem icon={Settings} label={t("common.preferences") || "Preferences"} />
        </Link>
        <Link href="/client/impact" className="block">
          <MenuItem icon={Heart} label={t("nav.impact") || "Impact"} />
        </Link>
        <Link href="/client/contact" className="block">
          <MenuItem icon={MessageCircle} label={t("nav.contact") || "Contact"} />
        </Link>
        <Link href="/client/profile/help-support" className="block">
          <MenuItem icon={HelpCircle} label={t("profile.helpSupport") || "Help & Support"} />
        </Link>
        
        {user.role === "PROVIDER" && (
          <Link href="/provider/home" className="block">
            <MenuItem icon={Store} label={t("profile.providerDashboard") || "Provider Dashboard"} />
          </Link>
        )}
            </div>

      {/* Sign Out */}
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="w-full flex items-center justify-center gap-3 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
        size="lg"
      >
        <LogOut className="w-5 h-5" />
        {t("common.signOut") || "Sign Out"}
      </Button>
      
      <div className="mt-12 text-center">
        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">{t("profile.version") || "Version"} 2.4.0 (Build 182)</p>
      </div>
      </div>
  );
};

function MenuItem({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) {
  return (
    <Button 
      onClick={onClick}
      variant="outline"
      className="w-full flex items-center justify-between p-4 bg-white hover:border-primary/50 group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <Icon size={20} />
        </div>
        <span className="font-medium">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
    </Button>
  );
}

export default ProfilePage;