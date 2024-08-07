import Link from "next/link";
import Image from 'next/image';
import { Button } from "./ui/button";

const Nav = () => {
    return (
      <header className='w-full fixed top-0 left-0  bg-white shadow-md border-b border-gray-200'>

      <nav className='max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 py-4'>
        <Link href="/" className='flex items-center'>
          <Image
            src="/fullname1.png"
            alt="Logo"
            width={180} 
            height={150} 
            className="object-contain"
          />
        </Link>
        <div className="flex items-center gap-5 min-w-[130px]">
          <Button variant="secondary" className="text-gray-600 border-gray-300">Sign in as seller</Button>
          <Button variant="secondary" className="text-gray-600 border-gray-300">Sign in as client</Button>
        </div>
      </nav>
    </header>)};
export default Nav
