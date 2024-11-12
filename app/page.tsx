import React from 'react';

const WelcomePage = () => {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-8 text-white"
      style={{
        background: 'linear-gradient(to bottom, #98cca8, #98cca8)',
      }}
    >
      <h1
        className="text-3xl sm:text-5xl mb-4 sm:mb-6 animate-fadeInDown text-center"
        style={{
          color: '#fac6a8',
          WebkitTextStroke: '0.6px #000000',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        Welcome to Save The Plate!
      </h1>
      <p
        className="text-lg sm:text-xl mb-6 sm:mb-8 text-center animate-fadeInUp"
        style={{
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        When you are ready to begin, click below!
      </p>
      <a
        href="/onboarding"
        className="px-6 py-3 bg-[#fffc5ed3] text-black font-bold border border-black rounded-full shadow-md transition duration-300 transform hover:scale-105 hover:bg-blue-100 cursor-pointer"
      >
        Next step  
      </a>

    </div>
  );
};

export default WelcomePage;
