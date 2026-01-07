"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Footer from "./Footer";

/**
 * ConditionalFooter component that shows the footer only on landing/public pages
 * Footer is hidden when users are signed in or on authenticated routes
 */
const ConditionalFooter = () => {
  const pathname = usePathname();
  const { user, loading } = useUser();

  // Don't render footer while checking authentication
  if (loading) {
    return null;
  }

  // Define public routes where footer should always show (even if logged in)
  const publicRoutes = [
    "/",
    "/privacy",
    "/data-deletion",
    "/signIn",
    "/business-signup",
    "/contact",
    "/impact",
  ];

  // Check if current route is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route);

  // Define authenticated route prefixes where footer should be hidden
  const authenticatedPrefixes = [
    "/client",
    "/provider",
    "/onboarding",
    "/auth",
  ];

  // Check if current route is an authenticated route
  const isAuthenticatedRoute = authenticatedPrefixes.some(prefix => 
    pathname?.startsWith(prefix)
  );

  // Show footer only on public routes OR when user is not authenticated
  // Hide footer on authenticated routes or when user is logged in (except on public routes)
  const shouldShowFooter = isPublicRoute || (!user && !isAuthenticatedRoute);

  if (!shouldShowFooter) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;

