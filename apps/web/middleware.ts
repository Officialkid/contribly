import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public paths that never require authentication
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/privacy",
  "/terms",
  "/",
  "/_next",
  "/api",
  "/favicon.ico",
];

// Paths that match invite links (dynamic routes)
const INVITE_PATH_PATTERN = /^\/invites\/[^\/]+$/;

// Paths that require authentication
const PROTECTED_PATH_PATTERNS = [
  /^\/orgs\/.+/,
  /^\/onboarding/,
  /^\/organizations/,
  /^\/profile/,
  /^\/settings/,
  /^\/dashboard/,
  /^\/notifications/,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow invite acceptance (public route)
  if (INVITE_PATH_PATTERN.test(pathname)) {
    return NextResponse.next();
  }

  // Check if path requires authentication
  const isProtectedPath = PROTECTED_PATH_PATTERNS.some((pattern) =>
    pattern.test(pathname)
  );

  if (isProtectedPath) {
    // Check for auth cookie (JWT)
    // Note: We cannot verify the JWT signature in Edge runtime (no crypto)
    // The API will reject invalid tokens. This is acceptable - we just check presence.
    const authCookie = request.cookies.get("token");

    if (!authCookie) {
      // No auth cookie - redirect to login with next parameter
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
