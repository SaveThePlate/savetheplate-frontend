'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    
      // clean URL
      window.history.replaceState({}, "", "/onboarding");
      router.push("/onboarding");
    }
  }, []);


}
