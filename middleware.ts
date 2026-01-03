import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Decode JWT token (basic decoding without verification)
 * Works in Edge Runtime
 */
function decodeToken(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    // Use atob for Edge Runtime compatibility
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * Get user type from token
 */
function getUserTypeFromToken(token: string): string | null {
  const decoded = decodeToken(token);
  if (!decoded) return null;

  return (
    (decoded.user_type as string | undefined) ||
    (decoded.userType as string | undefined) ||
    (decoded.user_type_name as string | undefined) ||
    null
  );
}

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

  // If we have a token, check user type and route accordingly
  if (token) {
    const userType = getUserTypeFromToken(token);

    // If user is WHOLESALER, redirect to wholesaler panel
    if (userType === "WHOLESALER" || userType === "wholesaler") {
      // If accessing admin or farmer routes, redirect to wholesaler panel
      if (pathname.startsWith("/") && !pathname.startsWith("/wholesaler") && !isPublicRoute) {
        return NextResponse.redirect(new URL("/wholesaler", request.url));
      }
      // If accessing signin with valid token, redirect to wholesaler panel
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/wholesaler", request.url));
      }
    } 
    // If user is FARMER, redirect to farmer panel
    else if (userType === "FARMER" || userType === "farmer") {
      // If accessing admin, wholesaler, or commercial buyer routes, redirect to farmer panel
      if ((pathname.startsWith("/") && !pathname.startsWith("/farmer") && !isPublicRoute) || 
          pathname.startsWith("/wholesaler") || pathname.startsWith("/commercial-buyer")) {
        return NextResponse.redirect(new URL("/farmer", request.url));
      }
      // If accessing signin with valid token, redirect to farmer panel
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/farmer", request.url));
      }
    }
    // If user is COMMERCIAL_BUYER, redirect to commercial buyer panel
    else if (userType === "COMMERCIAL_BUYER" || userType === "commercial_buyer" || userType === "COMMERCIALBUYER" || userType === "commercialBuyer") {
      // If accessing admin, wholesaler, or farmer routes, redirect to commercial buyer panel
      if ((pathname.startsWith("/") && !pathname.startsWith("/commercial-buyer") && !isPublicRoute) || 
          pathname.startsWith("/wholesaler") || pathname.startsWith("/farmer")) {
        return NextResponse.redirect(new URL("/commercial-buyer", request.url));
      }
      // If accessing signin with valid token, redirect to commercial buyer panel
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/commercial-buyer", request.url));
      }
    }
    // If user is ADMIN, ensure they're not accessing other user type routes
    else {
      if (pathname.startsWith("/wholesaler") || pathname.startsWith("/farmer") || pathname.startsWith("/commercial-buyer")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      // If accessing login/signup with valid token cookie, redirect to dashboard
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
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

