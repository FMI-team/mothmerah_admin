import type { Metadata } from "next";
import React from "react";
import SupportTicketsPage from "@/components/support/SupportTicketsPage";

export const metadata: Metadata = {
  title: "مركز الدعم - تذاكر الدعم | Support Tickets",
  description: "متابعة وإدارة تذاكر الدعم الفني والتشغيلي.",
};

export default function SupportPage() {
  return <SupportTicketsPage />;
}


