"use client";
import Link from "next/link";
import Image from "next/image";
import { X, Menu } from "lucide-react";
import { useState } from "react";
import React from "react";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const [showMap, setShowMap] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative flex flex-col min-h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 z-30 bg-white shadow-sm border-b border-gray-200">
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 md:px-12 h-16">
          {/* Logo */}
          <Link href="/provider/home" className="flex items-center h-full">
            <Image
              src="/fullname1.png"
              alt="Logo"
              width={220}
              height={80}
              className="object-contain hidden md:block h-full"
            />
            <Image
              src="/logoOnly.png"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain block md:hidden h-full"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8 text-[15px] font-medium text-gray-700">
            <Link href="/provider/profile">Profile</Link>
            <Link href="/provider/publish">Publish an Offer</Link>
            {/* <Link href="/provider/home">Published Offers</Link> */}
            <Link href="/provider/orders">Orders</Link>
            {/* <Link href="/provider/history">History</Link> */}
            <Link href="/provider/scan">Scan QR Code</Link>
            <Link href="/provider/logout" className="text-red-500">
              Logout
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

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="lg:hidden w-full bg-white border-t border-gray-200 shadow-md absolute top-16 left-0 z-40">
            <nav className="flex flex-col p-5 space-y-3 text-gray-700 text-[15px]">
              <Link href="/provider/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link href="/provider/publish" onClick={() => setMenuOpen(false)}>Publish an Offer</Link>
              {/* <Link href="/provider/home" onClick={() => setMenuOpen(false)}>Published Offers</Link> */}
              <Link href="/provider/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
              {/* <Link href="/provider/history" onClick={() => setMenuOpen(false)}>History</Link> */}
              <Link href="/provider/scan" onClick={() => setMenuOpen(false)}>Scan QR Code</Link>
              <Link
                href="/provider/logout"
                className="text-red-500"
                onClick={() => setMenuOpen(false)}
              >
                Logout
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="">
        {React.cloneElement(children as React.ReactElement, { showMap })}
      </main>
    </section>
  );
}
