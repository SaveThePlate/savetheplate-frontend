import type { AuthUser } from "@/context/UserContext";
import type { AuthIntentRole } from "@/lib/authIntent";

/**
 * Centralized post-auth redirect decision.
 *
 * Rules:
 * - role NONE (or missing): go to onboarding role selection
 * - role CLIENT: go to client home
 * - role PENDING_PROVIDER: go to provider home (allows quick onboarding)
 * - role PROVIDER: go to provider home (fully approved provider)
 */
export function getPostAuthRedirect(
  user: AuthUser | null | undefined,
  intentRole?: AuthIntentRole | null,
): string {
  const role = user?.role;

  if (!role || role === "NONE") {
    if (intentRole === "CLIENT") return "/onboarding?intent=CLIENT";
    if (intentRole === "PROVIDER") return "/onboarding?intent=PROVIDER";
    return "/onboarding";
  }
  if (role === "CLIENT") return "/client/home";
  
  // Both PENDING_PROVIDER and PROVIDER go to provider home
  // PENDING_PROVIDER can use the platform while awaiting approval
  if (role === "PENDING_PROVIDER" || role === "PROVIDER") {
    return "/provider/home";
  }

  // Unknown role: be safe and send to onboarding.
  return "/onboarding";
}


