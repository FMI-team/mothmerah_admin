import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to check authentication for protected routes
 * Note: This provides basic server-side protection.
 * Client-side token expiration is handled by AuthGuard component.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/signin", "/signup", "/error-404"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Skip middleware for API routes and static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Protected routes (admin routes - anything that's not public)
  const isProtectedRoute = !isPublicRoute;

  // Get token from cookies
  const token = request.cookies.get("access_token")?.value;

  // If accessing protected route without token cookie, allow but client-side will handle
  // (Client-side AuthGuard will check localStorage and redirect if needed)
  if (isProtectedRoute && !token) {
    // Allow the request - client-side AuthGuard will handle the check
    // This is because tokens are primarily stored in localStorage (client-side only)
    return NextResponse.next();
  }

  // If accessing login/signup with valid token cookie, redirect to dashboard
  if (isPublicRoute && pathname.startsWith("/signin") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

// Configure which routes should trigger this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

