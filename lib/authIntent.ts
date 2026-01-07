export type AuthIntentRole = "CLIENT" | "PROVIDER";

export const AUTH_INTENT_ROLE_KEY = "auth-intent-role";

export function normalizeAuthIntentRole(
  v: string | null | undefined,
): AuthIntentRole | null {
  const upper = String(v || "")
    .trim()
    .toUpperCase();
  if (upper === "CLIENT" || upper === "PROVIDER") return upper;
  return null;
}

export function readAuthIntentRole(): AuthIntentRole | null {
  if (typeof window === "undefined") return null;
  try {
    return normalizeAuthIntentRole(window.localStorage.getItem(AUTH_INTENT_ROLE_KEY));
  } catch {
    return null;
  }
}

export function writeAuthIntentRole(role: AuthIntentRole | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!role) {
      window.localStorage.removeItem(AUTH_INTENT_ROLE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_INTENT_ROLE_KEY, role);
  } catch {
    // ignore storage failures (private mode / disabled storage)
  }
}


