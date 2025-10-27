import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "http://localhost:3001";

const isPublicPath = (pathname: string) => {
  const publicPrefixes = ["/_next", "/api", "/static", "/favicon.ico"];
  const publicExact = ["/", "/signIn", "/signUp"];
  if (publicExact.includes(pathname)) return true;
  return publicPrefixes.some((p) => pathname.startsWith(p));
};

async function fetchUserRole(accessToken: string) {
  try {
    const res = await fetch(`${BACKEND}/users/get-role`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.role || null;
  } catch (e) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  // only protect provider and client prefixes
  if (pathname.startsWith("/provider") || pathname.startsWith("/client")) {
    const accessToken = req.cookies.get("accessToken")?.value;
    const cookieRole = req.cookies.get("userRole")?.value;
    const cookieType = req.cookies.get("userType")?.value;

    // If we have an accessToken cookie, validate it with the backend.
    if (accessToken) {
      const role = await fetchUserRole(accessToken);
      if (!role) {
        return NextResponse.redirect(new URL("/signIn", req.url));
      }

      if (pathname.startsWith("/provider")) {
        if (String(role).toLowerCase() !== "provider") {
          return NextResponse.redirect(new URL("/signIn", req.url));
        }
        return NextResponse.next();
      }

      if (pathname.startsWith("/client")) {
        if (String(role).toLowerCase() !== "client") {
          return NextResponse.redirect(new URL("/signIn", req.url));
        }
        return NextResponse.next();
      }
    }

    // Fallback: if accessToken cookie is not present, allow based on userRole/userType cookies set by the callback.
    // This is a pragmatic fallback to avoid redirect races while cookies/localStorage are being initialized.
    const roleFromCookie = cookieRole ? decodeURIComponent(cookieRole) : null;
    const typeFromCookie = cookieType ? String(cookieType) : null;

    if (pathname.startsWith("/provider")) {
      const isProvider = (typeFromCookie && typeFromCookie === "1") || (roleFromCookie && roleFromCookie.toLowerCase().includes("provider"));
      if (isProvider) return NextResponse.next();
      return NextResponse.redirect(new URL("/signIn", req.url));
    }

    if (pathname.startsWith("/client")) {
      const isClient = (typeFromCookie && typeFromCookie === "2") || (roleFromCookie && roleFromCookie.toLowerCase().includes("client"));
      if (isClient) return NextResponse.next();
      return NextResponse.redirect(new URL("/signIn", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/provider/:path*", "/client/:path*"],
};
