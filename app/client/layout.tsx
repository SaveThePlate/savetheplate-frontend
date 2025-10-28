"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import React from "react";
import { X, Menu, LogOut } from "lucide-react"; // Import icons for the menu

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [showMap, setShowMap] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // State for the menu
  const [userId, setUserId] = useState<string | null>(null);

  // derive userId from stored JWT so we can link to the dynamic orders route
  React.useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.id) setUserId(String(payload.id));
    } catch (e) {
      // ignore malformed token
    }
  }, []);

  return (
    <section>
      {/* Header */}
      <header className="w-full fixed top-0 left-0 z-10 bg-white shadow-md border-b border-gray-200 h-16">
        <nav className="max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 h-full">
          {/* Logo */}
          <Link href="/client/home" className="flex items-center h-full">
            <Image
              src="/fullname1.png"
              alt="Logo"
              width={250}
              height={100}
              className="object-contain lg:block md:block hidden h-full"
            />
            <Image
              src="/logoOnly.png"
              alt="Logo"
              width={150}
              height={150}
              className="object-contain block lg:hidden md:hidden h-full"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
                      <Link href="/client/home" className="text-gray-600 hover:text-gray-900" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
            <Link href={userId ? `/client/orders/${userId}` : "/client/orders"} className="text-gray-600 hover:text-gray-900">
              My Purchases
            </Link>
            <Link href="/client/profile" className="text-gray-600 hover:text-gray-900">
              Profile
            </Link>
            <Link 
              href="/client/logout" 
              className="flex items-center px-4 py-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Link>
          </div>

          {/* Burger Menu Button */}
          <button className="lg:hidden block" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
      </header>

      {/* Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-lg transform ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform w-64 z-20 p-6`}
      >
        <button className="absolute top-4 right-4" onClick={() => setMenuOpen(false)}>
          <X size={28} />
        </button>
        <nav className="mt-12 flex flex-col space-y-4">
          <Link href="/client/home" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link href={userId ? `/client/orders/${userId}` : "/client/orders"} className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            My purchases
          </Link>
          <Link href="/client/profile" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Profile
          </Link>
          {/* <Link href="/client/settings" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Settings
          </Link> */}
          <Link href="/client/logout" className="text-lg font-medium text-red-500" onClick={() => setMenuOpen(false)}>
            Logout
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <main className="">{React.cloneElement(children as React.ReactElement, { showMap })}</main>
    </section>
  );
}
