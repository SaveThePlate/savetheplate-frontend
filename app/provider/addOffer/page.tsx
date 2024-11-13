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
        const response = await axios.get(process.env.NEXT_PUBLIC_BACKEND_URL + '/auth/get-user-by-token', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status !== 200) {
          throw new Error('Invalid response from server');
        }
      } catch (error) {
        router.push("/signIn");
      }
    };

    verifyToken();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#cdeddf] p-6">
        <AddOffer />
    </div>
  );
};

export default AddOfferPage;
