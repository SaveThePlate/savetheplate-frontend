import React from 'react';
import Offers from '@/components/Offers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const Home = () => {
  return (
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center"> 
      <div className="w-full flex justify-center mb-6 pt-6">
      <Link href="/map">
      
      <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform duration-300 ease-in-out transform hover:scale-110 hover:bg-gradient-to-r hover:from-cyan-600 hover:to-blue-600 hover:shadow-xl hover:text-white">
        View Available Offers Around You 📍
      </Button>

      </Link>

      </div>

      <Offers />
    </main>
  );
};

export default Home;
