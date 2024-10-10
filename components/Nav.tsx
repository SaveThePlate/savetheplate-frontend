import Link from "next/link";
import Image from 'next/image';
import { Button } from "./ui/button";

const Nav = () => {
  return (
    <header className='w-full fixed top-0 left-0 z-10 bg-white shadow-md border-b border-gray-200 h-16'>
      <nav className='max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 h-full'>
        <Link href="/" className='flex items-center h-full'>
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

        <div className="flex items-center gap-3 h-full">
          <Link href="/addOffer">
            <Button className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:from-emerald-500 hover:to-emerald-700 hover:shadow-xl">
              Publish an Offer
            </Button>
          </Link>
          <Link href="/">
            <Button className=" text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:from-pink-500 hover:to-rose-700 hover:shadow-xl">
              Show Offers
            </Button>
          </Link>
        </div>


      </nav>
    </header>
  );
};

export default Nav;
