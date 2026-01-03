import type { Metadata } from "next";
import React from "react";
import WholesalerProductsPage from "@/components/products/WholesalerProductsPage";

export const metadata: Metadata = {
  title: "ادارة كتالوج المنتجات | Product Catalog Management",
  description: "ادارة كتالوج المنتجات وحالاتها ونوعها",
};

export default function WholesalerProducts() {
  return <WholesalerProductsPage />;
}

