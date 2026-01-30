import type { Metadata } from "next";
import React from "react";
import WholesalerInventoryPage from "@/components/inventory/WholesalerInventoryPage";

export const metadata: Metadata = {
  title: "ادارة المخزون | Inventory Management",
  description: "عرض وإدارة أصناف المخزون والكميات المتاحة",
};

export default function WholesalerInventory() {
  return <WholesalerInventoryPage />;
}
