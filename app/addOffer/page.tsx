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
    // This will ensure that no content is hidden under the nav or the footer
    <main className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-6 bg-white min-h-screen w-full">
      <AddOffer />
    </main>
  );
};

export default AddOfferPage;
