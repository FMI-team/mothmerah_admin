import type { Metadata } from "next";
import WholesalerDashboardOverview from "@/components/dashboard/WholesalerDashboardOverview";

export const metadata: Metadata = {
  title: "لوحة التحكم | Wholesaler Dashboard",
  description: "لوحة التحكم للجملة",
};

export default function WholesalerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          لوحة التحكم
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          مرحبا بعودتك إليك نظرة عامة على السوق
        </p>
      </div>

      <WholesalerDashboardOverview />
    </div>
  );
}