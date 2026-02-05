"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { Home, ShoppingBag, User, LogOut, Menu, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { OfferTypeModal } from "./OfferTypeModal";
import { LoadingSkeleton } from "./ui/LoadingSkeleton";

// Lazy load OfferTypeModal for better performance
const LazyOfferTypeModal = lazy(() => import("./OfferTypeModal").then(mod => ({ 
  default: mod.OfferTypeModal 
})));

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showOfferTypeModal, setShowOfferTypeModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { userRole, user } = useUser();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (user?.id) setUserId(String(user.id));
  }, [user?.id]);

  const isClient = userRole === "CLIENT";
  const isProvider = userRole === "PROVIDER" || userRole === "PENDING_PROVIDER";
  const homeLink = isClient ? "/client/home" : isProvider ? "/provider/home" : "/";
  const profileLink = isClient ? "/client/profile" : isProvider ? "/provider/profile" : "/";
  const ordersLink = isClient 
    ? (userId ? `/client/orders/${userId}` : "/client/orders")
    : "/provider/orders";
  const logoutLink = isClient ? "/client/logout" : isProvider ? "/provider/logout" : "/signIn";

  return (
    <section className="relative flex flex-col min-h-screen bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] overflow-x-hidden" style={{ isolation: 'isolate' }}>
      {/* Header */}
      <header className="w-full fixed top-0 left-0 z-30 bg-white shadow-sm border-b border-gray-200 safe-area-inset-top">
        <nav className="w-full mx-auto flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
          {/* Logo */}
          <Link href={homeLink} className="flex items-center h-full">
            <div className="relative hidden md:block h-full" style={{ width: '200px', minWidth: '150px' }}>
              <Image
                src="/fullname1.png"
                alt="Logo"
                fill
                priority
                sizes="200px"
                className="object-contain"
              />
            </div>
            <div className="relative block md:hidden h-full" style={{ width: '120px', minWidth: '100px' }}>
              <Image
                src="/fullname1.png"
                alt="Logo"
                fill
                priority
                sizes="120px"
                className="object-contain"
              />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 text-[15px] font-medium text-gray-700">
            <LanguageSwitcher variant="button" />
            <Link href={homeLink} className="hover:text-green-600 transition-colors">
              {t("nav.home")}
            </Link>
            {isClient && (
              <Link
                href={ordersLink}
                className="hover:text-green-600 transition-colors"
              >
                {t("nav.my_purchases")}
              </Link>
            )}
            {isProvider && (
              <>
                <button 
                  onClick={() => setShowOfferTypeModal(true)}
                  className="hover:text-green-600 transition-colors"
                >
                  {t("nav.publish_offer")}
                </button>
                <Link href="/provider/orders" className="hover:text-green-600 transition-colors">
                  {t("nav.orders")}
                </Link>
              </>
            )}
            <Link href={profileLink} className="hover:text-green-600 transition-colors">
              {t("nav.profile")}
            </Link>
            <Link href="/impact" className="hover:text-green-600 transition-colors">
              {t("nav.impact")}
            </Link>
            <Link href="/contact" className="hover:text-green-600 transition-colors">
              {t("nav.contact")}
            </Link>
            {(isClient || isProvider) && (
              <Link
                href={logoutLink}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut size={18} /> {t("nav.logout")}
              </Link>
            )}
          </div>

          {/* Burger Menu Button */}
          <button
            className="lg:hidden block text-gray-700"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </nav>

        {/* Mobile Drawer */}
        <div
          className={`fixed top-0 right-0 h-full w-[280px] sm:w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 overflow-y-auto ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 flex-shrink-0 sticky top-0 bg-white z-10">
            <Image
              src="/logoOnly.png"
              alt="Logo"
              width={36}
              height={36}
              className="sm:w-10 sm:h-10 object-contain"
            />
            <button onClick={() => setMenuOpen(false)} className="p-1">
              <X size={20} className="sm:w-6 sm:h-6 text-gray-700" />
            </button>
          </div>

          <nav className="flex flex-col p-4 sm:p-6 space-y-3 sm:space-y-4 text-gray-700 font-medium">
            <div className="pb-2 border-b border-gray-200">
              <LanguageSwitcher variant="button" />
            </div>
            <Link
              href={homeLink}
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.home")}
            </Link>
            {isClient && (
              <Link
                href={ordersLink}
                onClick={() => setMenuOpen(false)}
                className="hover:text-green-600"
              >
                {t("nav.my_purchases")}
              </Link>
            )}
            {isProvider && (
              <>
                <button
                  onClick={() => {
                    setShowOfferTypeModal(true);
                    setMenuOpen(false);
                  }}
                  className="hover:text-green-600"
                >
                  {t("nav.publish_offer")}
                </button>
                <Link
                  href="/provider/orders"
                  onClick={() => setMenuOpen(false)}
                  className="hover:text-green-600"
                >
                  {t("nav.orders")}
                </Link>
              </>
            )}
            <Link
              href={profileLink}
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.profile")}
            </Link>
            <Link
              href="/impact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.impact")}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.contact")}
            </Link>
            {(isClient || isProvider) && (
              <Link
                href={logoutLink}
                onClick={() => setMenuOpen(false)}
                className="text-red-500 flex items-center gap-2 hover:text-red-600"
              >
                <LogOut size={18} /> {t("nav.logout")}
              </Link>
            )}
          </nav>
        </div>

        {/* Overlay for Drawer */}
        {menuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-30"
            onClick={() => setMenuOpen(false)}
          ></div>
        )}
      </header>

      {/* Main Content */}
      <main className="w-full mx-auto pt-14 sm:pt-16 pb-20 sm:pb-24">
        {children}
      </main>

      {/* Bottom Navigation (mobile) */}
      {(isClient || isProvider) && (
        <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-md flex justify-around items-center py-2 pb-safe z-[50] lg:hidden safe-area-inset-bottom">
          {isClient ? (
            <>
              <Link
                href="/client/home"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <Home size={22} />
                <span className="text-xs mt-1">{t("nav.home")}</span>
              </Link>
              <Link
                href={ordersLink}
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <ShoppingBag size={22} />
                <span className="text-xs mt-1">{t("nav.orders")}</span>
              </Link>
              <Link
                href="/client/profile"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <User size={22} />
                <span className="text-xs mt-1">{t("nav.profile")}</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/provider/home"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <Home size={22} />
                <span className="text-xs mt-1">{t("nav.home")}</span>
              </Link>
              <button
                onClick={() => setShowOfferTypeModal(true)}
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <Plus size={22} />
                <span className="text-xs mt-1">{t("nav.publish")}</span>
              </button>
              <Link
                href="/provider/orders"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <ShoppingBag size={22} />
                <span className="text-xs mt-1">{t("nav.orders")}</span>
              </Link>
              <Link
                href="/provider/profile"
                className="flex flex-col items-center text-gray-700 hover:text-green-600"
              >
                <User size={22} />
                <span className="text-xs mt-1">{t("nav.profile")}</span>
              </Link>
            </>
          )}
        </nav>
      )}
      
      {/* Offer Type Modal */}
      <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>}>
        <LazyOfferTypeModal 
          isOpen={showOfferTypeModal}
          onClose={() => setShowOfferTypeModal(false)}
        />
      </Suspense>
    </section>
  );
}

