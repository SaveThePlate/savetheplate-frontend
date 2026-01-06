/**
 * Returns the backend origin for client-side API calls.
 *
 * Goal: avoid accidental production builds pointing to localhost (which triggers
 * "local network" permissions on some browsers and breaks on iOS).
 *
 * If the site is not running on localhost but the baked env points to localhost,
 * we fall back to the current site origin (assuming reverse-proxy routes /auth, /users, ...).
 *
 * If you deploy backend on a separate domain, set NEXT_PUBLIC_BACKEND_URL accordingly.
 */
export function getBackendOrigin(): string {
  const envUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || "").trim();

  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;
    const currentHost = window.location.hostname;
    const isLocalSite = currentHost === "localhost" || currentHost === "127.0.0.1";

    const looksLocalBackend =
      envUrl.includes("localhost") || envUrl.includes("127.0.0.1") || envUrl.includes("0.0.0.0");

    const chosen = !isLocalSite && looksLocalBackend ? currentOrigin : (envUrl || currentOrigin);
    return chosen.replace(/\/$/, "");
  }

  // Server-side (during SSR/build). Prefer env, otherwise default to localhost backend.
  return (envUrl || "http://localhost:3001").replace(/\/$/, "");
}

export function backendUrl(pathname: string): string {
  const origin = getBackendOrigin();
  if (!pathname) return origin;
  if (pathname.startsWith("/")) return `${origin}${pathname}`;
  return `${origin}/${pathname}`;
}


