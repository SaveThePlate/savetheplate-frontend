"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Menu, LogOut, Home, ShoppingBag, User, Plus } from "lucide-react";
import { useState } from "react";
import React from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
// import GuidedTour from "@/components/GuidedTour";
// import { getProviderHomeTourSteps } from "@/components/tourSteps";
import RouteGuard from "@/components/RouteGuard";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <RouteGuard allowedRoles={["PROVIDER"]} redirectTo="/signIn">
      <section className="relative flex flex-col min-h-screen bg-gradient-to-br from-[#FBEAEA] via-[#EAF3FB] to-[#FFF8EE] overflow-x-hidden">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 z-30 bg-white shadow-sm border-b border-gray-200 safe-area-inset-top">
        <nav className="w-full mx-auto flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
          {/* Logo */}
          <Link href="/provider/home" className="flex items-center h-full">
            <div className="relative hidden md:block h-full" style={{ width: '220px', minWidth: '150px' }}>
              <Image
                src="/fullname1.png"
                alt="Logo"
                fill
                priority
                sizes="220px"
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
          <div data-tour="navigation-menu" className="hidden lg:flex items-center space-x-8 text-[15px] font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <LanguageSwitcher variant="button" />
              {/* <GuidedTour 
                steps={getProviderHomeTourSteps(t)} 
                tourKey="provider-home"
              /> */}
            </div>
            <Link href="/provider/home" className="hover:text-green-600 transition-colors">
              {t("nav.home")}
            </Link>
            <Link href="/provider/profile" className="hover:text-green-600 transition-colors">
              {t("nav.profile")}
            </Link>
            <Link href="/provider/publish" className="hover:text-green-600 transition-colors">
              {t("nav.publish_offer")}
            </Link>
            <Link href="/provider/orders" className="hover:text-green-600 transition-colors">
              {t("nav.orders")}
            </Link>
            <Link href="/provider/impact" className="hover:text-green-600 transition-colors">
              {t("nav.impact")}
            </Link>
            <Link href="/provider/contact" className="hover:text-green-600 transition-colors">
              {t("nav.contact")}
            </Link>
            <Link
              href="/provider/logout"
              className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} /> {t("nav.logout")}
            </Link>
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
          className={`fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <Image
              src="/logoOnly.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <button onClick={() => setMenuOpen(false)}>
              <X size={24} className="text-gray-700" />
            </button>
          </div>
          <nav className="flex flex-col p-6 space-y-4 text-gray-700 font-medium">
            <div className="pb-2 border-b border-gray-200 flex items-center gap-2">
              <LanguageSwitcher variant="button" />
              {/* <div onClick={() => setMenuOpen(false)} className="flex items-center">
                <GuidedTour 
                  steps={getProviderHomeTourSteps(t)} 
                  tourKey="provider-home"
                />
              </div> */}
            </div>
            <Link
              href="/provider/home"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.home")}
            </Link>
            <Link
              href="/provider/profile"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.profile")}
            </Link>
            <Link
              href="/provider/publish"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.publish_offer")}
            </Link>
            <Link
              href="/provider/orders"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.orders")}
            </Link>
            <Link
              href="/provider/impact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.impact")}
            </Link>
            <Link
              href="/provider/contact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              {t("nav.contact")}
            </Link>
            <Link
              href="/provider/logout"
              onClick={() => setMenuOpen(false)}
              className="text-red-500 flex items-center gap-2 hover:text-red-600"
            >
              <LogOut size={18} /> {t("nav.logout")}
            </Link>
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
        {React.cloneElement(children as React.ReactElement)}
      </main>

      {/* 📱 Bottom Navigation (mobile) */}
      <nav data-tour="bottom-nav" className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-md flex justify-around items-center py-2 pb-safe z-[50] lg:hidden safe-area-inset-bottom">
        <Link
          href="/provider/home"
          className="flex flex-col items-center text-gray-700 hover:text-green-600"
        >
          <Home size={22} />
          <span className="text-xs mt-1">{t("nav.home")}</span>
        </Link>
        <Link
          href="/provider/publish"
          className="flex flex-col items-center text-gray-700 hover:text-green-600"
        >
          <Plus size={22} />
          <span className="text-xs mt-1">{t("nav.publish")}</span>
        </Link>
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
      </nav>
    </section>
    </RouteGuard>
  );
}