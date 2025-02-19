"use client";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import Image from 'next/image';
import { X, Menu } from "lucide-react"; 
import { useState } from "react";
import React from "react";


export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  // const { userRole, loading } = useUser();
    const [showMap, setShowMap] = useState(false);
   const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section>
      {/* Header */}
      <header className=" mb-20 w-full fixed top-0 left-0 z-10 bg-white shadow-md border-b border-gray-200 h-16">
        <nav className="max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 h-full ">
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

          {/* Burger Menu Button */}
          <button className="lg:hidden block" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
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
          <Link href="/provider/profile" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Profile
          </Link>
          <Link href="/provider/publish" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Publish an Offer
          </Link>
          <Link href="/provider/home" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Published Offers
          </Link>
          <Link href="/provider/orders" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Orders
          </Link>
          <Link href="/provider/history" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            History
          </Link>
          <Link href="/provider/scan" className="text-lg font-medium" onClick={() => setMenuOpen(false)}>
            Scan QR Code
          </Link>
          <Link href="/provider/logout" className="text-lg font-medium text-red-500" onClick={() => setMenuOpen(false)}>
            Logout
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <main className=" ">{React.cloneElement(children as React.ReactElement, { showMap })}</main>
    </section>
  );
}






