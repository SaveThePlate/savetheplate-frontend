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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-green-400 via-green-300 to-green-200 p-6">
      <main className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-green-900">Add a New Offer</h1>
        <AddOffer />
      </main>
    </div>
  );
};

export default AddOfferPage;
