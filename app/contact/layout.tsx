"use client";

import SharedLayout from "@/components/SharedLayout";
import RouteGuard from "@/components/RouteGuard";

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={["CLIENT", "PROVIDER"]} redirectTo="/signIn">
      <SharedLayout>{children}</SharedLayout>
    </RouteGuard>
  );
}

