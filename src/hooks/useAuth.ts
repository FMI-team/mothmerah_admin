"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isTokenExpired, logout, isAuthenticated } from "@/lib/auth";

/**
 * Hook to check authentication status and handle token expiration
 */
export function useAuth() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") {
        setIsChecking(false);
        return;
      }

      // Check if token exists and is not expired
      if (isTokenExpired()) {
        // Token is expired, logout and redirect
        logout("/signin");
        setIsAuth(false);
      } else {
        // Token is valid
        setIsAuth(isAuthenticated());
      }

      setIsChecking(false);
    };

    checkAuth();

    // Set up interval to check token expiration every minute
    const interval = setInterval(() => {
      if (isTokenExpired()) {
        logout("/signin");
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [router]);

  return { isAuthenticated: isAuth, isChecking };
}

/**
 * Hook to protect routes with authentication
 */
export function useRequireAuth() {
  const { isAuthenticated, isChecking } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isChecking && !isAuthenticated) {
      // Already handled by useAuth hook (logout redirects)
      // But we can also redirect here as a fallback
      router.push("/signin");
    }
  }, [isAuthenticated, isChecking, router]);

  return { isAuthenticated, isChecking };
}

