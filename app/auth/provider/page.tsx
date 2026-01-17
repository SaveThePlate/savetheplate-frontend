"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { writeAuthIntentRole } from "@/lib/authIntent";

export default function ProviderAuthEntry() {
  const router = useRouter();

  useEffect(() => {
    // Start clean, and remember the intended audience.
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refresh-token");
      localStorage.removeItem("remember");
    } catch {}
    writeAuthIntentRole("PROVIDER");
    router.replace("/signIn?intent=PROVIDER");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4">
      <div className="flex flex-col items-center gap-3 text-center max-w-md">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-700 text-sm font-medium">Redirecting…</p>
      </div>
    </div>
  );
}




