"use client";

import React, { useCallback, useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon } from "@/icons";
import { getBaseUserDashboardOverview, type BaseUserDashboardResponse } from "../../../services/dashboard";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">{icon}</div>
    <div className="mt-5 flex items-end justify-between">
      <div>
        <span className="text-sm text-gray-500 dark:text-gray-400">{title}</span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{value}</h4>
      </div>
      {change != null && change !== "" && (
        <Badge color="success">
          <ArrowUpIcon />
          {change}
        </Badge>
      )}
    </div>
  </div>
);

const ProductsIcon = () => (
  <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);
const AuctionsIcon = () => (
  <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const InventoryIcon = () => (
  <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 
    012 2m-6 9l2 2 4-4" />
  </svg>
);
const AvailableIcon = () => (
  <svg className="text-gray-800 size-6 dark:text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

export default function BaseUserDashboardOverview() {
  const [data, setData] = useState<BaseUserDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBaseUserDashboardOverview();
      if (response.status === 200 && response.data) {
        setData(response.data);
      } else {
        setError("فشل تحميل بيانات لوحة التحكم");
      }
    } catch {
      setError("فشل تحميل بيانات لوحة التحكم");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const formatValue = (value: number) => value.toLocaleString("ar-SA");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">لوحة التحكم</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">مرحباً بعودتك، إليك ملخص نشاطك</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
              <div className="h-12 w-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="mt-5 space-y-2">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          <KPICard title="منتجاتي" value={formatValue(data?.my_products?.value ?? 0)} change={data?.my_products?.change} icon={<ProductsIcon />} />
          <KPICard title="مزاداتي" value={formatValue(data?.my_auctions?.value ?? 0)} change={data?.my_auctions?.change} icon={<AuctionsIcon />} />
          <KPICard title="عناصر المخزون" value={formatValue(data?.my_inventory_items?.value ?? 0)} change={data?.my_inventory_items?.change} icon={<InventoryIcon />} />
          <KPICard title="المزادات المتاحة" value={formatValue(data?.available_auctions?.value ?? 0)} change={data?.available_auctions?.change} icon={<AvailableIcon />} />
        </div>
      )}
    </div>
  );
}
