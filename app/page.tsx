import React from 'react';
import Image from 'next/image';

const WelcomePage = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8"
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
          }}
        >
          Welcome to Save The Plate!
        </h1>
        <p
          className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 font-semibold animate-fadeInUp"
          style={{
            color: '#333333',
            textShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
          }}
        >
          Discover, save, and savor your next meal!
        </p>
        <a
          href="/onboarding"
          className="px-6 py-3 sm:px-8 sm:py-4 bg-[#fffc5ed3] text-black font-bold text-sm sm:text-lg border border-black rounded-full shadow-lg transition duration-300 transform hover:scale-110 hover:bg-yellow-300 cursor-pointer"
        >
          Get Started
        </a>
      </div>
    </div>
  );
};

export default WelcomePage;
