import { NextResponse } from "next/server";

// The prototype is open access. Headers apply without an account gate.
export function proxy(): NextResponse {
  // Direct open access — auth gating removed
  const response = NextResponse.next();

  // Security headers for application routes
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
