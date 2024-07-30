import Link from "next/link";
import Image from 'next/image';
import { Button } from "./ui/button";

const Nav = () => {
    return (
        <header className='w-full fixed top-0 left-0 z-10 bg-white shadow-md'>
        <nav className='max-w-[1440px] mx-auto flex items-center justify-between sm:px-16 px-6 py-4'>
          <Link href="/" className='flex items-center'>
            <Image
              src="/fullname1.png"
              alt="Logo"
              width={180} // Adjust width as needed
              height={150} // Adjust height as needed
              className="object-contain"
            />
          </Link>
          <div className="flex items-center gap-5">
            <Button variant="secondary">Sign in as seller</Button>
            <Button variant="secondary">Sign in as client</Button>
          </div>
        </nav>
      </header>)};
export default Nav
