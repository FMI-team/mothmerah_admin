import type { Metadata } from "next";
import React from "react";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import SalesChart from "@/components/dashboard/SalesChart";
import TopSellingCategories from "@/components/dashboard/TopSellingCategories";
import LatestActivity from "@/components/dashboard/LatestActivity";

export const metadata: Metadata = {
  title: "لوحة التحكم | Commercial Buyer Dashboard",
  description: "لوحة التحكم للمشتري التجاري",
};

export default function CommercialBuyerDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <DashboardOverview />
      </div>

      <div className="col-span-12">
        <SalesChart />
      </div>

      <div className="col-span-12 xl:col-span-7">
        <TopSellingCategories />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <LatestActivity />
      </div>
    </div>
  );
}

