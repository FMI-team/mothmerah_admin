"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isTokenExpired, logout, getUserType } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard component
 * Checks token expiration and logs out if expired
 * Automatically checks every minute for token expiration
 * Also checks user type and redirects if accessing wrong panel
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial check
    if (isTokenExpired()) {
      // Logout and redirect to signin
      logout("/signin");
      return;
    }

    // Check user type and route accordingly
    const userType = getUserType();
    const isWholesaler = userType === "WHOLESALER" || userType === "wholesaler";
    const isFarmer = userType === "FARMER" || userType === "farmer";
    const isAdminRoute = pathname.startsWith("/") && 
                         !pathname.startsWith("/wholesaler") && 
                         !pathname.startsWith("/farmer") && 
                         !pathname.startsWith("/signin") && 
                         !pathname.startsWith("/signup");
    const isWholesalerRoute = pathname.startsWith("/wholesaler");
    const isFarmerRoute = pathname.startsWith("/farmer");

    // If wholesaler tries to access admin or farmer routes, redirect
    if (isWholesaler && (isAdminRoute || isFarmerRoute)) {
      router.push("/wholesaler");
      return;
    }

    // If farmer tries to access admin or wholesaler routes, redirect
    if (isFarmer && (isAdminRoute || isWholesalerRoute)) {
      router.push("/farmer");
      return;
    }

    // If admin tries to access wholesaler or farmer routes, redirect
    if (!isWholesaler && !isFarmer && (isWholesalerRoute || isFarmerRoute)) {
      router.push("/");
      return;
    }

    // Set up periodic check for token expiration (every minute)
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        logout("/signin");
        clearInterval(interval);
      }
    }, 60000); // Check every minute

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pathname, router]); // Run when pathname changes

  // Render children if token is valid
  return <>{children}</>;
}

