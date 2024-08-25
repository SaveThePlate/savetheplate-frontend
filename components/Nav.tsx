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
            <Button className="bg-lime-400 hover:bg-lime-500 text-black font-bold py-2 px-4 border border-b-4 border-lime-600 rounded h-full">
              Publish an offer
            </Button>
          </Link>
          <Link href="/">
            <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 border border-b-4 border-red-800 rounded h-full">
              I want food
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Nav;
