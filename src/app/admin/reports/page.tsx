import type { Metadata } from "next";
import ReportsPage from "@/components/reports/ReportsPage";

export const metadata: Metadata = {
  title: "التقارير المالية | Financial Reports",
  description: "انشاء وعرض وتصدير التقارير بناء على معايير مختلفة",
};

export default function Reports() {
  return <ReportsPage />;
}