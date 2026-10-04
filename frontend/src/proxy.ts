import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js 16 Proxy — OPTIMISTIC check only.
 *
 * Verifies a Better Auth session cookie exists before
 * entering protected areas. Cookie validity and role
 * authorization are enforced authoritatively by the
 * server-side layouts (src/lib/session.ts) and the
 * NestJS backend.
 */
export function proxy(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ??
    request.cookies.get(
      "__Secure-better-auth.session_token",
    );

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/student/:path*"],
};
