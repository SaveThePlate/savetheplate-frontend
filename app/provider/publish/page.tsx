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
    // Redirect directly to addOffer page
    router.push("/provider/addOffer");
  }, [router]);

  // Return null while redirecting
  return null;
};

export default SelectOfferTypePage;
