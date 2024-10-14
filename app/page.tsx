import React from 'react';
import Offers from '@/components/Offers';


const Home = () => {
  return (
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center"> 
      <div className="w-full flex justify-center mb-6 pt-6">
       Now browse /home or /profile if client is restaurant

      </div>

      <Offers />
    </main>
  );
};

export default Home;
