import type { Metadata } from "next";
import React from "react";
import WarehouseManagement from "@/components/warehouses/WarehouseManagement";

export const metadata: Metadata = {
  title: "ادارة المخازن | Warehouse Management",
  description: "ادارة كتالوج المنتجات وحالاتها ونوعها",
};

export default function WholesalerWarehouses() {
  return <WarehouseManagement />;
}

