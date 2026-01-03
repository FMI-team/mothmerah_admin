import type { Metadata } from "next";
import React from "react";
import WholesalerInvoicesPage from "@/components/invoices/WholesalerInvoicesPage";

export const metadata: Metadata = {
  title: "ادارة الفواتير | Commercial Buyer Invoices",
  description: "ادارة الفواتير للمشتري التجاري",
};

export default function CommercialBuyerInvoicesPage() {
  return <WholesalerInvoicesPage />;
}

