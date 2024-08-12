import Link from "next/link";
import Image from 'next/image';
import { Button } from "./ui/button";

const Nav = () => {
    return (
      <header className='w-full fixed top-0 left-0 z-10 bg-white shadow-md border-b border-gray-200'>

      <nav className='max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 py-4'>
        <Link href="/" className='flex items-center'>
          <Image
            src="/fullname1.png"
            alt="Logo"
            width={250} 
            height={100} 
            className="object-contain lg:block md:block hidden"
          />
          <Image
            src="/logoOnly.png"
            alt="Logo"
            width={150} 
            height={150} 
            className="object-contain block lg:hidden md:hidden"
          />
        </Link>
        <div className="flex items-center gap-3">
        
          <Button className="bg-lime-400 hover:bg-lime-500 text-black font-bold py-2 px-4 border border-b-4 border-lime-600 rounded">
            <Link href="/addOffer"> Publish an offer </Link>
          </Button>

          <Button className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 border border-b-4 border-red-800 rounded">
            <Link href="/signIn"> I want food </Link>
          </Button>
        
        

        </div>
      </nav>
    </header>)};
export default Nav
