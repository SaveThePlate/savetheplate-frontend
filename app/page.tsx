import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Home = () => {
  const primaryColor = "#8B4513"; // Example primary color from the logo

  return (
    <main className="pt-24 sm:pt-32 p-6 bg-white min-h-screen">
      <div className="text-center mb-6">
        <Link href="/edit-location" className="inline-block bg-yellow-500 text-white px-4 py-2 rounded-md shadow">
          Edit Location
        </Link>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-gray-700">Recommended for you</h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6 gap-4">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:w-60">
          <div className="bg-gray-300 h-40 rounded-md flex items-center justify-center mb-4">
            <Image src="/path-to-image.jpg" alt="Item Image" width={240} height={160} className="object-cover rounded-md" />
          </div>
          <div className="flex justify-between items-center mt-auto">
            <Link href="/details" className="text-gray-600 border-b-2 border-transparent hover:border-primary transition">
              Details
            </Link>
            <Link href="/reserve" style={{ backgroundColor: primaryColor, color: "white" }} className="px-4 py-2 rounded-md">
              Reserve
            </Link>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white p-6 rounded-lg shadow-md flex flex-col sm:w-60">
          <div className="bg-gray-300 h-40 rounded-md flex items-center justify-center mb-4">
            <Image src="/path-to-image.jpg" alt="Item Image" width={240} height={160} className="object-cover rounded-md" />
          </div>
          <div className="flex justify-between items-center mt-auto">
            <Link href="/details" className="text-gray-600 border-b-2 border-transparent hover:border-primary transition">
              Details
            </Link>
            <Link href="/reserve" style={{ backgroundColor: primaryColor, color: "white" }} className="px-4 py-2 rounded-md">
              Reserve
            </Link>
          </div>
        </div>

        {/* Additional cards can be added here */}
      </div>
    </main>
  );
};

export default Home;
