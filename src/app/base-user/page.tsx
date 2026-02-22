import type { Metadata } from "next";
import BaseUserDashboardOverview from "@/components/dashboard/BaseUserDashboardOverview";
import BaseUserLatestActivity from "@/components/dashboard/BaseUserLatestActivity";

export const metadata: Metadata = {
  title: "لوحة التحكم | Base User Dashboard",
  description: "لوحة التحكم للمستخدم الأساسي",
};

export default function BaseUserDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <BaseUserDashboardOverview />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <BaseUserLatestActivity />
      </div>
    </div>
  );
}
