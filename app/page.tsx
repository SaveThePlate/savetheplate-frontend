import React from 'react';
import Offers from '@/components/Offers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Home = () => {
  return (
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center"> 
      <div className="w-full flex justify-center mb-6">
      <Link href="/map">
        <Button className="text-lg font-bold">View available offers around you</Button>
      </Link>
      </div>

      <Offers />
    </main>
  );
};

export default Home;
