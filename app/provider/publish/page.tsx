"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";

const SelectOfferTypePage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.log("No token found, redirecting to signIn");
      router.push("/signIn");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get('http://localhost:3001/auth/get-user-by-token', {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Token verification successful:', response.data);

        if (response.status !== 200) {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        router.push("/signIn");
      }
    };

    verifyToken();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 via-green-300 to-green-200 p-6">
      <main className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-900">Select Offer Type</h1>
        
        {/* Offer Buttons */}
        <div className="space-y-4">
          <button
            className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition transform hover:scale-105"
            onClick={() => router.push("./addOffer")}
          >
            Add Offer
          </button>
          <button
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition transform hover:scale-105"
            onClick={() => router.push("./createMagicBox")}
          >
            Create Magic Box
          </button>
        </div>

        {/* Magic Box Info Section */}
        <section className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800">What is a Magic Box?</h2>
          <p className="text-gray-600 mt-2">
            A magic box is a bag filled with a selection of unsold items that can be offered to clients at a discounted price. 
            It is a great way to reduce waste while providing value to customers.
          </p>
        </section>
      </main>
    </div>
  );
};

export default SelectOfferTypePage;
