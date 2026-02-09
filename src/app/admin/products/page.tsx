import type { Metadata } from "next";
import React from "react";
import ProductsPage from "@/components/products/ProductsPage";

export const metadata: Metadata = {
  title: "ادارة كتالوج المنتجات | Products Catalog",
  description: "ادارة كتالوج المنتجات وتفاصيلها وانواعها",
};

export default function ProductsCatalogPage() {
  return <ProductsPage />;
}


