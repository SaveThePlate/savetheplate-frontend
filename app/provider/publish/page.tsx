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
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/auth/get-user-by-token', {
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
    <div className="min-h-screen flex items-center justify-center bg-[#cdeddf] p-6">
      <main className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#243B28]">Select Offer Type</h1>
        
        {/* Offer Buttons */}
        <div className="space-y-4">
          <button
            className="font-bold w-full bg-[#c2f0dc] text-[#243B28] py-3 rounded-full border border-black hover:bg-[#82f0c0] shadow-lg hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push("./addOffer")}
          >
            Add Offer
          </button>
          <button
            className="font-bold w-full bg-[#1ec27b] text-white py-3 rounded-full border border-black hover:bg-[#147a4e] shadow-lg hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push("./createMagicBox")}
          >
            Create Magic Box
          </button>
        </div>

        {/* Magic Box Info Section */}
        <section className="mt-8 p-6 bg-[#fdfdead3] border border-[#243B28] rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-[#243B28]">What is a Magic Box?</h2>
          <p className="text-[#243B28] mt-2">
           A Magic box can contain a variety of different items or multiples of the same item, providing a surprise assortment. 
           The contents are randomly selected, ensuring a unique experience with every purchase.
          </p>
        </section>
      </main>
    </div>
  );
};

export default SelectOfferTypePage;
