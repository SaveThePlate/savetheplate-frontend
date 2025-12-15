"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axios from "axios";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

/**
 * RouteGuard component that protects routes based on user roles
 * @param children - The content to render if access is allowed
 * @param allowedRoles - Array of roles that are allowed to access this route
 * @param redirectTo - Optional redirect path if access is denied (defaults to /signIn)
 */
export default function RouteGuard({
  children,
  allowedRoles,
  redirectTo = "/signIn",
}: RouteGuardProps) {
  const { userRole, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for user context to finish loading
      if (loading) {
        return;
      }

      const token = localStorage.getItem("accessToken");

      // If no token, redirect to sign in
      if (!token) {
        router.push(redirectTo);
        return;
      }

      // If userRole is still null after loading, try to fetch it directly
      let currentRole = userRole;
      if (!currentRole) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/get-role`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          currentRole = response.data.role;
        } catch (error) {
          // Token is invalid, redirect to sign in
          console.error("Error fetching user role:", error);
          localStorage.removeItem("accessToken");
          router.push(redirectTo);
          return;
        }
      }

      // Check if user role is in allowed roles
      if (currentRole && !allowedRoles.includes(currentRole)) {
        // Redirect based on role
        if (currentRole === "CLIENT") {
          router.push("/client/home");
        } else if (currentRole === "PROVIDER") {
          router.push("/provider/home");
        } else {
          // No valid role, redirect to sign in or onboarding
          router.push(redirectTo);
        }
        return;
      }

      // For PROVIDER role, check if they have completed location details
      if (currentRole === "PROVIDER" && allowedRoles.includes("PROVIDER")) {
        try {
          const userDetails = await axios.get(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const { phoneNumber, mapsLink } = userDetails.data || {};
          // If location details are missing, redirect to fillDetails page
          if (!phoneNumber || !mapsLink) {
            router.push("/onboarding/fillDetails");
            return;
          }
        } catch (error) {
          // If we can't fetch user details, redirect to fillDetails to be safe
          console.error("Error fetching user details in RouteGuard:", error);
          router.push("/onboarding/fillDetails");
          return;
        }
      }

      // Access granted
      setIsChecking(false);
    };

    checkAccess();
  }, [userRole, loading, allowedRoles, redirectTo, router, pathname]);

  // Show loading state while checking
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-sm">Checking access...</p>
        </div>
      </div>
    );
  }

  // If user role is not in allowed roles, don't render children
  if (userRole && !allowedRoles.includes(userRole)) {
    return null;
  }

  return <>{children}</>;
}

