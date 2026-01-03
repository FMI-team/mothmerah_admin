import type { Metadata } from "next";
import React from "react";
import WholesalerProductsPage from "@/components/products/WholesalerProductsPage";

export const metadata: Metadata = {
  title: "ادارة كتالوج المنتجات | Farmer Products",
  description: "ادارة كتالوج المنتجات وحالاتها ونوعها للمزارع",
};

export default function FarmerProductsPage() {
  return <WholesalerProductsPage />;
}

