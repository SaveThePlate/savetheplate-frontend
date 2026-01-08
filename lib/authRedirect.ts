import type { AuthUser } from "@/context/UserContext";
import type { AuthIntentRole } from "@/lib/authIntent";

/**
 * Centralized post-auth redirect decision.
 *
 * Rules:
 * - role NONE (or missing) with CLIENT intent: go directly to client home (auto-set role)
 * - role NONE (or missing) with PROVIDER intent: go to onboarding for provider setup
 * - role NONE (or missing) without intent: go to onboarding for role selection
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
    // For client intent, bypass onboarding and go directly to client home
    // The signup flow will handle setting the CLIENT role
    if (intentRole === "CLIENT") return "/client/home";
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


