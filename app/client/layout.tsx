"use client";

import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Home, ShoppingBag, User, LogOut, Menu, X } from "lucide-react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.id) setUserId(String(payload.id));
    } catch {
      console.warn("Invalid token");
    }
  }, []);

  return (
    <section className="min-h-screen flex flex-col bg-[#f9fbf9] overflow-x-hidden">
      {/* 🌿 Header */}
      <header className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left spacer to center logo properly on mobile */}
          <div className="w-8 sm:hidden" />

          {/* Centered logo */}
          <Link href="/client/home" className="flex items-center justify-center flex-1 sm:flex-none">
            <Image
              src="/logoOnly.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="ml-2 font-bold text-lg sm:text-xl text-[#44624a] hidden sm:inline">
              SaveThePlate
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/client/home" className="text-gray-700 hover:text-[#44624a] font-medium">
              Home
            </Link>
            <Link
              href={userId ? `/client/orders/${userId}` : "/client/orders"}
              className="text-gray-700 hover:text-[#44624a] font-medium"
            >
              My Purchases
            </Link>
            <Link href="/client/profile" className="text-gray-700 hover:text-[#44624a] font-medium">
              Profile
            </Link>
            <Link
              href="/client/logout"
              className="flex items-center text-red-500 hover:text-red-600 font-medium"
            >
              <LogOut size={18} className="mr-1" /> Logout
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            className="sm:hidden text-gray-700 ml-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {/* 🌸 Slide-in mobile menu */}
      <div
        className={`fixed top-0 right-0 w-3/4 sm:w-64 h-full bg-white shadow-xl transform ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out z-50`}
      >
        <button
          className="absolute top-4 right-4 text-gray-700"
          onClick={() => setMenuOpen(false)}
        >
          <X size={26} />
        </button>

        <nav className="mt-20 flex flex-col space-y-6 px-6">
          <Link href="/client/home" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-[#44624a]">
            Home
          </Link>
          <Link
            href={userId ? `/client/orders/${userId}` : "/client/orders"}
            onClick={() => setMenuOpen(false)}
            className="text-lg font-medium text-gray-700 hover:text-[#44624a]"
          >
            My Purchases
          </Link>
          <Link href="/client/profile" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-gray-700 hover:text-[#44624a]">
            Profile
          </Link>
          <Link href="/client/logout" onClick={() => setMenuOpen(false)} className="text-lg font-medium text-red-500 hover:text-red-600">
            Logout
          </Link>
        </nav>
      </div>

      {/* 🌼 Main Content */}
      <main className="flex-1 mt-16 mb-20 md:mb-0 px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full overflow-x-hidden">
        {children}
      </main>

      {/* 📱 Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full md:hidden bg-white border-t border-gray-200 shadow-md flex justify-around items-center py-2 z-40">
        <Link href="/client/home" className="flex flex-col items-center text-gray-700 hover:text-[#44624a]">
          <Home size={22} />
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link
          href={userId ? `/client/orders/${userId}` : "/client/orders"}
          className="flex flex-col items-center text-gray-700 hover:text-[#44624a]"
        >
          <ShoppingBag size={22} />
          <span className="text-xs mt-1">Orders</span>
        </Link>
        <Link href="/client/profile" className="flex flex-col items-center text-gray-700 hover:text-[#44624a]">
          <User size={22} />
          <span className="text-xs mt-1">Profile</span>
        </Link>
      </nav>
    </section>
  );
}
