"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const WelcomePage = () => {
  const router = useRouter();
  const [useRole, setRole] = useState(null);


  const handleGetStarted = async () => {
    const token = localStorage.getItem("accessToken");
  
    if (!token) {
      console.warn("No access token found. Redirecting to sign in.");
      router.push('/signIn'); 
      return;
    }
  
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const role = response?.data?.role;
      if (role) {
        setRole(role);

        if (role === 'PROVIDER') {
          router.push('/provider/home');
        } else if (role === 'CLIENT') {
          router.push('/client/home');
        
        } else {
          console.error('Unknown role:', role);
          router.push('/onboarding'); 
        }
      } else {
        console.error('Role not found in response');
        router.push('/onboarding'); 
      }
    } catch (error) {
      console.error('Error fetching role:', error);
      router.push('/onboarding'); 
    } 
  }; 
  
  

  return (
    <div
      className=" min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8"
      style={{
        backgroundColor: '#98cca8', 
      }}
    >
      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-md px-4 sm:px-8 py-12 bg-white rounded-3xl shadow-lg">
        
        {/* Decorative Shapes
        <div className="absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 max-w-full max-h-full w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-pink-200 rounded-full opacity-60 animate-spin-slow"
             
        ></div>
        <div className="absolute bottom-0 right-0 transform translate-x-1/2 translate-y-1/2 max-w-full max-h-full w-[100px] h-[100px] sm:w-[250px] sm:h-[250px] bg-yellow-200 rounded-full opacity-60 animate-bounce"
     
        ></div> */}

        <div className="image-container mb-6">
          <Image src="/loveyou.png" className="floating-image" width={150} height={150} alt="Image 1" />
        </div>

        <h1
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold animate-fadeInDown mb-4 sm:mb-6"
          style={{
            color: '#ffbe98',
            WebkitTextStroke: '0.5px #000000',
            textShadow: '4px 4px 6px rgba(0, 0, 0, 0.15)',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Welcome to Save The Plate!
        </h1>
        <p
          className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 font-semibold animate-fadeInUp"
          style={{
            color: '#153100ff',
            textShadow: '1px 1px 3px rgba(96, 96, 96, 0.3)',
            fontFamily: 'Arial, sans-serif',

          }}
        >
          Discover, save, and savor your next meal!
        </p>
        <button
          onClick={handleGetStarted}
              className="w-full bg-[#fffc5ed3] text-black font-bold py-2 rounded-full border border-black hover:bg-[#cfcd4fd3] "
        >
          Get Started
        </button>
        
      </div>
    </div>
  );
};

export default WelcomePage;
