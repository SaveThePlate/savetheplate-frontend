"use client";
import Link from "next/link";
import Image from 'next/image';
import { Button } from "./ui/button";
import { useEffect, useState } from 'react';
import axios from 'axios';

const Nav = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      const token = localStorage.getItem('accessToken');
      try {
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/users/get-role', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 200) {
          setUserRole(response.data.role);
        } else {
          console.error('Failed to fetch user role:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching user role:');
      }
    };

    fetchUserRole();
  }, []);

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
          {userRole === 'PROVIDER' ? (
            <Link href="/provider/addOffer">
              <Button className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:from-emerald-500 hover:to-emerald-700 hover:shadow-xl">
                Publish an Offer
              </Button>
            </Link>
          ) : userRole === 'CLIENT' ? (
            <Link href="/client/offers">
              <Button className="bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold py-3 px-6 rounded-full shadow-md transition-all duration-300 ease-in-out transform hover:scale-110 hover:from-emerald-500 hover:to-emerald-700 hover:shadow-xl">
                View Offers
              </Button>
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
};

export default Nav;
