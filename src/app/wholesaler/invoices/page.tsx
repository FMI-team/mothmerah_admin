import type { Metadata } from "next";
import React from "react";
import WholesalerInvoicesPage from "@/components/invoices/WholesalerInvoicesPage";

export const metadata: Metadata = {
  title: "ادارة الفواتير | Invoice Management",
  description: "مرحبا بعودتك اليك نظرة عامة على السوق",
};

export default function WholesalerInvoices() {
  return <WholesalerInvoicesPage />;
}

