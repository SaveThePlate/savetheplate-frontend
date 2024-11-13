"use client";
import { useUser } from "@/context/UserContext";
import Link from "next/link";
import Image from 'next/image';
import { Button } from "@/components/ui/button";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { userRole, loading } = useUser();

  return (
    <section>
      <header className='w-full fixed top-0 left-0 z-10 bg-white shadow-md border-b border-gray-200 h-16'>
        <nav className='max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 h-full'>
          <Link href="/" className='flex items-center h-full'>
            <Image src="/fullname1.png" alt="Logo" width={250} height={100} className="object-contain lg:block md:block hidden h-full" />
            <Image src="/logoOnly.png" alt="Logo" width={150} height={150} className="object-contain block lg:hidden md:hidden h-full" />
          </Link>

          <div className="flex items-center gap-3 h-full">
            {/* {loading ? (
              <Button disabled>Loading...</Button> */}
            {/* // ) : userRole === 'PROVIDER' ? ( */}
              <Link href="/provider/publish">
                <Button className="text-black sm:text-lg border border-black bg-white  py-3 px-6 rounded-full shadow-md transition-all duration-200 ease-in-out transform hover:scale-110  hover:shadow-xl">
                Publish an Offer
                </Button>
              </Link>
            {/* // ) : null} */}
          </div>
        </nav>
      </header>

      <main className="pt-16 ">
      {children}</main>
      
      <footer className="w-full sticky bottom-0 bg-white shadow-inner border-t border-gray-200 h-16">
      <nav className='max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 h-full'>

        <Link href="./home" className="h-full flex items-center">
          <button className="hover:bg-gray-200 text-gray-800 font-bold h-full px-4 rounded flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256">
              <path d="M219.31,108.68l-80-80a16,16,0,0,0-22.62,0l-80,80A15.87,15.87,0,0,0,32,120v96a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V160h32v56a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V120A15.87,15.87,0,0,0,219.31,108.68ZM208,208H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48V120l80-80,80,80Z"></path>
            </svg>
          </button>
        </Link>

        {/* { userRole === 'PROVIDER' ? ( */}
          <Link href="./publish" className="h-full flex items-center">
            <button className="hover:bg-gray-200 text-gray-800 font-bold h-full px-4 rounded flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256">
                <path d="M208,128a8,8,0,0,1-8,8H136v64a8,8,0,0,1-16,0V136H56a8,8,0,0,1,0-16h64V56a8,8,0,0,1,16,0v64h64A8,8,0,0,1,208,128Z"></path>
              </svg>
            </button>
          </Link>
        {/* ) : null} */}

        <Link href="./profile" className="h-full flex items-center">
          <button className="hover:bg-gray-200 text-gray-800 font-bold h-full px-4 rounded flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="#000000" viewBox="0 0 256 256">
              <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path>
            </svg>
          </button>
        </Link>

      </nav>
    </footer>
    </section>
  );
}
