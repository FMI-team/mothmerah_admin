import type { Metadata } from "next";
import React from "react";
import InvoicesPage from "@/components/invoices/InvoicesPage";

export const metadata: Metadata = {
  title: "ادارة الفواتير | Invoice Management",
  description: "مرحبا بعودتك اليك نظرة عامة على السوق",
};

export default function Invoices() {
  return <InvoicesPage />;
}

