"use client";
import Link from "next/link";
import Image from 'next/image';
import { Button } from "./ui/button";
import { useState } from 'react';
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";

const Nav = () => {
  const { userRole } = useUser();
  const { t } = useLanguage();

  return (
    <header className='w-full fixed top-0 left-0 z-10 bg-white shadow-md border-b border-gray-200 h-16'>
      <nav className='max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 h-full'>
        <Link href="/" className='flex items-center h-full'>
          <div className="relative lg:block md:block hidden h-full" style={{ width: '250px', minWidth: '200px' }}>
            <Image
              src="/fullname1.png"
              alt="Logo"
              fill
              priority
              sizes="250px"
              className="object-contain"
            />
          </div>
          <div className="relative block lg:hidden md:hidden h-full" style={{ width: '60px', minWidth: '50px' }}>
            <Image
              src="/logoOnly.png"
              alt="Logo"
              fill
              priority
              sizes="60px"
              className="object-contain"
            />
          </div>
        </Link>

        <div className="flex items-center gap-3 h-full">
          <LanguageSwitcher variant="button" />
          {userRole === 'PROVIDER' ? (
            <Link href="/provider/addOffer">
              <Button className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:from-emerald-500 hover:to-emerald-700 hover:shadow-xl">
                {t("nav.publish_offer")}
              </Button>
            </Link>
          ) : userRole === 'CLIENT' ? (
            <Link href="/client/offers">
              <Button className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:from-emerald-500 hover:to-emerald-700 hover:shadow-xl">
                {t("nav.view_offers")}
              </Button>
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
};

export default Nav;
