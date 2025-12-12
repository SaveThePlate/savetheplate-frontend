"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Home, ShoppingBag, User, LogOut, Menu, X, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          return;
        }
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.id) {
            setUserId(String(payload.id));
          }
        } catch (parseError) {
          console.warn("Error parsing token:", parseError);
          // Try to get userId from API if token parsing fails
          try {
            const userResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (userResponse.data?.id) {
              setUserId(String(userResponse.data.id));
            }
          } catch (apiError) {
            console.error("Error fetching user info:", apiError);
          }
        }

        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setUserRole(response.data.role);
        } catch (err) {
          console.error("Error fetching role:", err);
        }
      } catch (error) {
        console.warn("Error in fetchUserInfo:", error);
      }
    };
    fetchUserInfo();
  }, []);

  const isClient = userRole === "CLIENT";
  const isProvider = userRole === "PROVIDER";
  const homeLink = isClient ? "/client/home" : isProvider ? "/provider/home" : "/";
  const profileLink = isClient ? "/client/profile" : isProvider ? "/provider/profile" : "/";
  const ordersLink = isClient 
    ? (userId ? `/client/orders/${userId}` : "/client/orders")
    : "/provider/orders";
  const logoutLink = isClient ? "/client/logout" : isProvider ? "/provider/logout" : "/signIn";

  return (
    <section className="relative flex flex-col min-h-screen bg-gray-50 overflow-x-hidden" style={{ isolation: 'isolate' }}>
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
          <div className="hidden lg:flex items-center space-x-4 text-[15px] font-medium text-gray-700">
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
                <Link href="/provider/publish" className="hover:text-green-600 transition-colors">
                  {t("nav.publish_offer")}
                </Link>
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
            </>
          )}
        </nav>
      )}
    </section>
  );
}

