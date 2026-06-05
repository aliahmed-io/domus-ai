import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Domus Route Protection Middleware
 *
 * Protected routes: /dashboard/* and /editor/*
 * Auth signal: `puter_session` cookie set by Puter.js SDK after sign-in.
 * If missing, redirect to /login with the original URL as `callbackUrl`.
 *
 * Note: Puter.js sets the cookie client-side. This middleware provides a
 * lightweight first-pass guard — actual auth validation happens via
 * puter.auth.isSignedIn() in each protected page's client component.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/editor"] as const;
const LOGIN_PATH = "/login";

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check for Puter session cookie
  const puterSession = request.cookies.get("puter_session");

  if (!puterSession?.value) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session exists — allow through
  const response = NextResponse.next();

  // Security headers for authenticated routes
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico and other static assets
     * - public folder files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon-|apple-touch|og-|site.webmanifest|wasm).*)",
  ],
};
