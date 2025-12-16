'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const handlePostLoginRedirect = async (token: string) => {
      try {
        // Store token
        localStorage.setItem('accessToken', token);

        // Get user role
        const roleResp = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const userRole = roleResp?.data?.role;

        if (!userRole || userRole === 'NONE') {
          // No role yet → go to onboarding
          router.push('/onboarding');
          return;
        }

        if (userRole === 'PROVIDER') {
          // Check provider profile details
          const userDetails = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          const { phoneNumber, mapsLink } = userDetails.data || {};

          if (!phoneNumber || !mapsLink) {
            router.push('/onboarding/fillDetails');
          } else {
            router.push('/provider/home');
          }
        } else if (userRole === 'CLIENT') {
          router.push('/client/home');
        } else {
          router.push('/onboarding'); // fallback
        }
      } catch (error) {
        console.error('Post-login redirect failed:', error);
        router.push('/onboarding'); // fallback
      }
    };

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      router.push('/signIn'); 
      return;
    }

    // all the redirect logic with the token
    handlePostLoginRedirect(token);
  }, [router]);

  return <p>Signing you in...</p>;
}
