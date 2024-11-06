import React from 'react';
import { UserProvider } from "@/context/UserContext";

const Home = () => {
  return (
    <UserProvider>
    <main className="pt-16 sm:pt-32 p-6 bg-white min-h-screen flex flex-col items-center"> 
      <div className="w-full flex justify-center mb-6 pt-6">
       Now browse /home or /profile if client is restaurant
       Now browse /home or /profile if client is restaurant

      </div>

    </main>
    </UserProvider>
  );
};

export default Home;
