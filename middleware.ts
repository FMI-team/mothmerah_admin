import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const publicRoutes = ["/signin", "/signup", "/error-404"];
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isProtectedRoute = !isPublicRoute;

  const token = request.cookies.get("access_token")?.value;

  if (isProtectedRoute && !token) {
    return NextResponse.next();
  }

  if (token) {
    const userType = getUserTypeFromToken(token);

    if (userType === "WHOLESALER" || userType === "wholesaler") {
      if (pathname.startsWith("/") && !pathname.startsWith("/wholesaler") && !isPublicRoute) {
        return NextResponse.redirect(new URL("/wholesaler", request.url));
      }
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/wholesaler", request.url));
      }
    } 
    else if (userType === "FARMER" || userType === "farmer") {
      if ((pathname.startsWith("/") && !pathname.startsWith("/farmer") && !isPublicRoute) || 
          pathname.startsWith("/wholesaler") || pathname.startsWith("/commercial-buyer")) {
        return NextResponse.redirect(new URL("/farmer", request.url));
      }
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/farmer", request.url));
      }
    }
    else if (userType === "COMMERCIAL_BUYER" || userType === "commercial_buyer" || userType === "COMMERCIALBUYER" || userType === "commercialBuyer") {
      if ((pathname.startsWith("/") && !pathname.startsWith("/commercial-buyer") && !isPublicRoute) || 
          pathname.startsWith("/wholesaler") || pathname.startsWith("/farmer")) {
        return NextResponse.redirect(new URL("/commercial-buyer", request.url));
      }
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/commercial-buyer", request.url));
      }
    }
    else if (userType === "BASE_USER" || userType === "base_user" || userType === "BASEUSER" || userType === "baseUser") {
      if ((pathname.startsWith("/") && !pathname.startsWith("/base-user") && !isPublicRoute) || 
          pathname.startsWith("/wholesaler") || pathname.startsWith("/farmer") || pathname.startsWith("/commercial-buyer")) {
        return NextResponse.redirect(new URL("/base-user", request.url));
      }
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/base-user", request.url));
      }
    }
    else {
      if (pathname.startsWith("/wholesaler") || pathname.startsWith("/farmer") || pathname.startsWith("/commercial-buyer") || pathname.startsWith("/base-user")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
      if (isPublicRoute && pathname.startsWith("/signin")) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

