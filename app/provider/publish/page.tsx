"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const SelectOfferTypePage = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/signIn");
      return;
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#cdeddf] to-[#e6f7f2] p-6">
      <main className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-8 text-center text-[#243B28]">
          Select Offer Type
        </h1>

        {/* Offer Buttons */}
        <div className="w-full flex flex-col gap-5">
          <button
            className="font-semibold w-full py-3 rounded-2xl bg-[#c2f0dc] text-[#243B28] border border-black shadow-md hover:bg-[#82f0c0] hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push("./addOffer")}
          >
            Add Offer
          </button>
          <button
            className="font-semibold w-full py-3 rounded-2xl bg-[#1ec27b] text-white border border-black shadow-md hover:bg-[#147a4e] hover:shadow-xl transition transform hover:scale-105"
            onClick={() => router.push("./createMagicBox")}
          >
            Create Magic Box
          </button>
        </div>

        {/* Magic Box Info Section */}
        <section className="mt-10 w-full bg-[#fefbdad3] border border-[#243B28] rounded-2xl shadow-inner p-6">
          <h2 className="text-xl font-semibold text-[#243B28] mb-2">
            What is a Magic Box?
          </h2>
          <p className="text-[#243B28] text-sm leading-relaxed">
            A Magic Box can contain a variety of different items or multiples of the same item, providing a surprise assortment. 
            The contents are randomly selected, ensuring a unique experience with every purchase.
          </p>
        </section>
      </main>
    </div>
  );
};

export default SelectOfferTypePage;
