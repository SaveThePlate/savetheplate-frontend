import React from 'react';

const WelcomePage = () => {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-600 to-green-400 text-white">
      <h1 className="text-4xl sm:text-5xl font-bold mb-4">Welcome on Board!</h1>
      <p className="text-lg sm:text-xl mb-8 text-center">
        We are excited to have you here. When you are ready to begin, click below!
      </p>
      <a
        href="/onboarding"
        className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold shadow-lg transition duration-300 transform hover:scale-105 hover:bg-blue-100"
      >
        Next Step
      </a>
    </div>
  );
};

export default WelcomePage;
