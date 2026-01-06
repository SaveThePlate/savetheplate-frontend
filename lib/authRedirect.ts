import type { AuthUser } from "@/context/UserContext";

/**
 * Centralized post-auth redirect decision.
 *
 * Rules:
 * - role NONE (or missing): go to onboarding role selection
 * - role CLIENT: go to client home
 * - role PENDING_PROVIDER: go to onboarding thank-you
 * - role PROVIDER: if missing required provider details -> onboarding fillDetails, else provider home
 */
export function getPostAuthRedirect(user: AuthUser | null | undefined): string {
  const role = user?.role;

  if (!role || role === "NONE") return "/onboarding";
  if (role === "CLIENT") return "/client/home";
  if (role === "PENDING_PROVIDER") return "/onboarding/thank-you";

  if (role === "PROVIDER") {
    const hasPhone = !!user?.phoneNumber;
    const hasMaps = !!(user?.mapsLink && String(user.mapsLink).trim());
    return hasPhone && hasMaps ? "/provider/home" : "/onboarding/fillDetails";
  }

  // Unknown role: be safe and send to onboarding.
  return "/onboarding";
}


