import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ✅ Define which routes are public (no auth required)
const publicRoutes = ["/sign-in", "/sign-up", "/"];

// ✅ Middleware runs on every request
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get Firebase ID token from cookies (set manually in client after login)
  const token = req.cookies.get("firebase_token")?.value;

  // --- Case 1: Authenticated user visiting public route ---
  if (token && publicRoutes.some((route) => pathname.startsWith(route))) {
    // Redirect to dashboard
    const dashboardUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // --- Case 2: Unauthenticated user visiting protected route ---
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));
  if (!token && !isPublic) {
    const signInUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // --- Case 3: Allow normal flow ---
  return NextResponse.next();
}

// ✅ Apply to all routes except static files and Next.js internals
export const config = {
  matcher: [
    "/((?!_next|.*\\.(?:jpg|jpeg|png|svg|ico|css|js|json|woff2?|ttf)).*)",
    "/(api|trpc)(.*)",
  ],
};
