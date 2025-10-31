"use client";
import Link from "next/link";
import Image from "next/image";
import { X, Menu, LogOut } from "lucide-react";
import { useState } from "react";
import React from "react";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative flex flex-col min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <nav className="max-w-[1440px] mx-auto flex items-center justify-between px-4 sm:px-8 lg:px-16 h-16">
          {/* Logo */}
          <Link href="/provider/home" className="flex items-center h-full">
            <Image
              src="/fullname1.png"
              alt="Logo"
              width={220}
              height={80}
              priority
              className="object-contain hidden md:block h-full"
              style={{ width: 'auto' }}
            />
            <Image
              src="/fullname1.png"
              alt="Logo"
              width={120}
              height={120}
              priority
              className="object-contain block md:hidden h-full"
              style={{ width: 'auto' }}
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 text-[15px] font-medium text-gray-700">
            <Link href="/provider/home" className="hover:text-green-600 transition-colors">
              Home
            </Link>
            <Link href="/provider/profile" className="hover:text-green-600 transition-colors">
              Profile
            </Link>
            <Link href="/provider/publish" className="hover:text-green-600 transition-colors">
              Publish Offer
            </Link>
            <Link href="/provider/orders" className="hover:text-green-600 transition-colors">
              Orders
            </Link>
            <Link
              href="/provider/logout"
              className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} /> Logout
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
            <Link
              href="/provider/home"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              Home
            </Link>
            <Link
              href="/provider/profile"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              Profile
            </Link>
            <Link
              href="/provider/publish"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              Publish Offer
            </Link>
            <Link
              href="/provider/orders"
              onClick={() => setMenuOpen(false)}
              className="hover:text-green-600"
            >
              Orders
            </Link>
            <Link
              href="/provider/logout"
              onClick={() => setMenuOpen(false)}
              className="text-red-500 flex items-center gap-2 hover:text-red-600"
            >
              <LogOut size={18} /> Logout
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
      <main className="w-full mx-auto">
        {React.cloneElement(children as React.ReactElement)}
      </main>
    </section>
  );
}