import type { Metadata } from "next";
import BaseUserInvoicesPage from "@/components/invoices/BaseUserInvoicesPage";

export const metadata: Metadata = {
  title: "ادارة الفواتير | Base User Invoices",
  description: "ادارة الفواتير للمستخدم الأساسي",
};

export default function BaseUserInvoicesPageRoute() {
  return <BaseUserInvoicesPage />;
}
