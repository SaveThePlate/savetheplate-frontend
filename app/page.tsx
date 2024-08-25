import React from 'react';
import Offers from '@/components/Offers';
import { Button } from '@/components/ui/button';


const Home = () => {

  return (
  <main className="pt-24 sm:pt-32 p-6 bg-white min-h-screen"> 

    <div className="">
      <Button className="">View available offers around you</Button>
    </div>

    <Offers/>
  </main>
  );

};

export default Home;
