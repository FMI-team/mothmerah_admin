import type { Metadata } from "next";
import React from "react";
import WarehouseManagement from "@/components/warehouses/WarehouseManagement";

export const metadata: Metadata = {
  title: "ادارة المخزون | Farmer Inventory",
  description: "ادارة كتالوج المنتجات وحالاتها ونوعها للمزارع",
};

export default function FarmerWarehousesPage() {
  return <WarehouseManagement />;
}

