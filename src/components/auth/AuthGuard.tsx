"use client";
import { useEffect } from "react";
import { isTokenExpired, logout } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Client-side authentication guard component
 * Checks token expiration and logs out if expired
 * Automatically checks every minute for token expiration
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial check
    if (isTokenExpired()) {
      // Logout and redirect to signin
      logout("/signin");
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
  }, []); // Run once on mount

  // Render children if token is valid
  return <>{children}</>;
}

