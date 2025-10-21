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
    <section className="relative">
      {/* Header */}
      <header className="w-full fixed top-0 left-0 z-30 bg-white shadow-md border-b border-gray-200">
        <nav className="max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 h-16">
          {/* Logo */}
          <Link href="/provider/home" className="flex items-center h-full">
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

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/provider/profile">Profile</Link>
            <Link href="/provider/publish">Publish an Offer</Link>
            <Link href="/provider/home">Published Offers</Link>
            <Link href="/provider/orders">Orders</Link>
            <Link href="/provider/history">History</Link>
            <Link href="/provider/scan">Scan QR Code</Link>
            <Link href="/provider/logout" className="text-red-500">
              Logout
            </Link>
          </div>

          {/* Burger Menu Button */}
          <button
            className="lg:hidden block"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>

        {/* Mobile Dropdown Menu (inside header) */}
        {menuOpen && (
          <div className="lg:hidden w-full bg-white border-t border-gray-200 shadow-md absolute top-16 left-0 z-40">
            <nav className="flex flex-col p-6 space-y-4">
              <Link href="/provider/profile" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link href="/provider/publish" onClick={() => setMenuOpen(false)}>Publish an Offer</Link>
              <Link href="/provider/home" onClick={() => setMenuOpen(false)}>Published Offers</Link>
              <Link href="/provider/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
              <Link href="/provider/history" onClick={() => setMenuOpen(false)}>History</Link>
              <Link href="/provider/scan" onClick={() => setMenuOpen(false)}>Scan QR Code</Link>
              <Link href="/provider/logout" className="text-red-500" onClick={() => setMenuOpen(false)}>
                Logout
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 sm:px-16">
        {React.cloneElement(children as React.ReactElement, { showMap })}
      </main>
    </section>
  );
}
