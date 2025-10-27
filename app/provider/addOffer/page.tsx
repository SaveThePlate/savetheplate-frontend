"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import axios from "axios";
import AddOffer from "@/components/AddOffer";

const AddOfferPage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/get-user-by-token`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status !== 200) throw new Error("Invalid response from server");
      } catch (error) {
        router.push("/signIn");
      }
    };

    verifyToken();
  }, [router]);

  return (
    <div className="bg-[#cdeddf] min-h-screen pt-24 pb-20 flex flex-col items-center">
      <main className="w-full max-w-3xl bg-white shadow-xl rounded-3xl p-6 sm:p-10 relative">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 font-semibold"
        >
          &larr; Back
        </button>

        <h1 className="text-3xl font-bold text-center text-green-900 mb-6">
          Add New Offer
        </h1>

        <AddOffer />
      </main>
    </div>
  );
};

export default AddOfferPage;
