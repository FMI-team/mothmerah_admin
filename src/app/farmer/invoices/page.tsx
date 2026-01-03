import type { Metadata } from "next";
import React from "react";
import WholesalerInvoicesPage from "@/components/invoices/WholesalerInvoicesPage";

export const metadata: Metadata = {
  title: "ادارة الفواتير | Farmer Invoices",
  description: "ادارة الفواتير للمزارع",
};

export default function FarmerInvoicesPage() {
  return <WholesalerInvoicesPage />;
}

