"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LocalStorage } from "@/lib/utils";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear all tokens
    LocalStorage.removeItem("accessToken");
    LocalStorage.removeItem("refresh-token");
    
    // Redirect to home page
    router.push("/");
  }, [router]);

  return null;
} 