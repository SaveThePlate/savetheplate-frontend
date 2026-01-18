"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";

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
  const { user, userRole, loading, fetchUserRole } = useUser();
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

      // If userRole is still null after loading, refresh via context (calls `/users/me`)
      if (!userRole) {
        try {
          await fetchUserRole();
        } catch {
          localStorage.removeItem("accessToken");
          router.push(redirectTo);
          return;
        }
      }
      const currentRole = userRole;

      // Check if user role is in allowed roles
      if (currentRole && !allowedRoles.includes(currentRole)) {
        // Redirect based on role
        if (currentRole === "CLIENT") {
          router.push("/client/home");
        } else if (currentRole === "PROVIDER" || currentRole === "PENDING_PROVIDER") {
          router.push("/provider/home");
        } else {
          // No valid role, redirect to sign in or onboarding
          router.push(redirectTo);
        }
        return;
      }

      // Access granted
      setIsChecking(false);
    };

    checkAccess();
  }, [user, userRole, loading, fetchUserRole, allowedRoles, redirectTo, router, pathname]);

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

