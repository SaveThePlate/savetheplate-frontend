"use client";

import Link from "next/link";
import React from "react";
import { Home, ShoppingBag, User, Plus, LogOut } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import RouteGuard from "@/components/RouteGuard";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <RouteGuard allowedRoles={["PROVIDER", "PENDING_PROVIDER"]} redirectTo="/signIn">
      <section className="relative flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 overflow-x-hidden" style={{ isolation: 'isolate' }}>
        {/* 🖥️ Desktop Sidebar Navigation */}
        <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-border shadow-lg z-40 flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-emerald-600">Save The Plate</h2>
          </div>
          <nav className="flex-1 p-4 space-y-2 flex flex-col">
            <div className="space-y-2">
              <Link
                href="/provider/home"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  pathname === "/provider/home" 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-foreground hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <Home size={20} />
                <span>{t("nav.home")}</span>
              </Link>
              <Link
                href="/provider/orders"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  pathname?.startsWith("/provider/orders") 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-foreground hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <ShoppingBag size={20} />
                <span>{t("nav.orders")}</span>
              </Link>
              <Link
                href="/provider/publish"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  pathname?.startsWith("/provider/publish") 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-foreground hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <Plus size={20} />
                <span>{t("nav.publish_offer")}</span>
              </Link>
              <Link
                href="/provider/profile"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                  pathname?.startsWith("/provider/profile") 
                    ? "bg-emerald-50 text-emerald-600" 
                    : "text-foreground hover:bg-emerald-50 hover:text-emerald-600"
                }`}
              >
                <User size={20} />
                <span>{t("nav.profile")}</span>
              </Link>
            </div>
            <div className="mt-auto pt-4 border-t border-border">
              <button
                onClick={() => {
                  localStorage.removeItem("accessToken");
                  localStorage.removeItem("refreshToken");
                  router.push("/");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-foreground hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={20} />
                <span>{t("common.signOut") || t("nav.logout") || "Sign Out"}</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* 🌸 Main Content */}
        <main className="w-full lg:w-[calc(100%-16rem)] lg:ml-64 mx-auto pb-20 sm:pb-24">
          {React.cloneElement(children as React.ReactElement)}
        </main>

        {/* 📱 Bottom Navigation - Mobile Only */}
        <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 w-full bg-white border-t border-border shadow-lg flex justify-around items-center py-2 pb-safe z-[50] lg:hidden safe-area-inset-bottom">
          <Link
            href="/provider/home"
            className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Home size={22} />
            <span className="text-xs mt-1">{t("nav.home")}</span>
          </Link>
          <Link
            href="/provider/publish"
            className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <Plus size={22} />
            <span className="text-xs mt-1">{t("nav.publish")}</span>
          </Link>
          <Link
            href="/provider/orders"
            className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ShoppingBag size={22} />
            <span className="text-xs mt-1">{t("nav.orders")}</span>
          </Link>
          <Link
            href="/provider/profile"
            className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <User size={22} />
            <span className="text-xs mt-1">{t("nav.profile")}</span>
          </Link>
        </nav>
      </section>
    </RouteGuard>
  );
}