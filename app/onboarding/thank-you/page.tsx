"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ThankYouRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-700 text-sm">Redirecting...</p>
      </div>
    </div>
  );
}


