import type { AuthUser } from "@/context/UserContext";
import type { AuthIntentRole } from "@/lib/authIntent";

/**
 * Centralized post-auth redirect decision (no onboarding flow).
 *
 * Rules:
 * - role NONE/missing with PROVIDER intent: send to business signup
 * - role NONE/missing otherwise: send to sign-in
 * - role CLIENT: go to client home
 * - role PENDING_PROVIDER or PROVIDER: go to provider home
 * - unknown: fall back to sign-in
 */
export function getPostAuthRedirect(
  user: AuthUser | null | undefined,
  intentRole?: AuthIntentRole | null,
): string {
  const role = user?.role;

  if (!role || role === "NONE") {
    if (intentRole === "PROVIDER") return "/business-signup";
    return "/signIn";
  }
  if (role === "CLIENT") return "/client/home";
  
  // Both PENDING_PROVIDER and PROVIDER go to provider home
  // PENDING_PROVIDER can use the platform while awaiting approval
  if (role === "PENDING_PROVIDER" || role === "PROVIDER") {
    return "/provider/home";
  }

  // Unknown role: be safe and send to sign-in.
  return "/signIn";
}


