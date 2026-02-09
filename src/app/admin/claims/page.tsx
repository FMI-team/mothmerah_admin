import type { Metadata } from "next";
import React from "react";
import ClaimsPage from "@/components/claims/ClaimsPage";

export const metadata: Metadata = {
  title: "ادارة المطالبات | Claims Management",
  description: "مراجعة وتعيين ومعالجة المطالبات",
};

export default function Claims() {
  return <ClaimsPage />;
}

