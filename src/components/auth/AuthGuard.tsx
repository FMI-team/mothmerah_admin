"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isTokenExpired, logout, getUserType } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isTokenExpired()) {
      logout("/signin");
      return;
    }

    const userType = getUserType();
    const isWholesaler = userType === "WHOLESALER" || userType === "wholesaler";
    const isFarmer = userType === "FARMER" || userType === "farmer";
    const isCommercialBuyer = userType === "COMMERCIAL_BUYER" || userType === "commercial_buyer" || userType === "COMMERCIALBUYER" || userType === "commercialBuyer";
    const isBaseUser = userType === "BASE_USER" || userType === "base_user" || userType === "BASEUSER" || userType === "baseUser";
    const isAdminRoute = pathname.startsWith("/") && 
                         !pathname.startsWith("/wholesaler") && 
                         !pathname.startsWith("/farmer") && 
                         !pathname.startsWith("/commercial-buyer") && 
                         !pathname.startsWith("/base-user") && 
                         !pathname.startsWith("/signin") && 
                         !pathname.startsWith("/signup");
    const isWholesalerRoute = pathname.startsWith("/wholesaler");
    const isFarmerRoute = pathname.startsWith("/farmer");
    const isCommercialBuyerRoute = pathname.startsWith("/commercial-buyer");
    const isBaseUserRoute = pathname.startsWith("/base-user");

    if (isWholesaler && (isAdminRoute || isFarmerRoute || isCommercialBuyerRoute || isBaseUserRoute)) {
      router.push("/wholesaler");
      return;
    }

    if (isFarmer && (isAdminRoute || isWholesalerRoute || isCommercialBuyerRoute || isBaseUserRoute)) {
      router.push("/farmer");
      return;
    }

    if (isCommercialBuyer && (isAdminRoute || isWholesalerRoute || isFarmerRoute || isBaseUserRoute)) {
      router.push("/commercial-buyer");
      return;
    }

    if (isBaseUser && (isAdminRoute || isWholesalerRoute || isFarmerRoute || isCommercialBuyerRoute)) {
      router.push("/base-user");
      return;
    }

    if (!isWholesaler && !isFarmer && !isCommercialBuyer && !isBaseUser && (isWholesalerRoute || isFarmerRoute || isCommercialBuyerRoute || isBaseUserRoute)) {
      router.push("/");
      return;
    }

    const interval = setInterval(() => {
      if (isTokenExpired()) {
        logout("/signin");
        clearInterval(interval);
      }
    }, 60000);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pathname, router]);

  return <>{children}</>;
}

