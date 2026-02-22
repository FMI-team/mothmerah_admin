"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getWholesalerDashboardOverview, type WholesalerDashboardResponse } from "../../../services/dashboard";

export default function WholesalerDashboardOverview() {
  const [data, setData] = useState<WholesalerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getWholesalerDashboardOverview();
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

  const ArrowUp = () => (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
            <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-2 h-8 w-16 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-4 w-12 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">منتجاتي</p>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{formatValue(data?.my_products?.value ?? 0)}</p>
          </div>
        </div>
        {data?.my_products?.change && (
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <ArrowUp />
            <span>{data.my_products.change}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">مزاداتي</p>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{formatValue(data?.my_auctions?.value ?? 0)}</p>
          </div>
        </div>
        {data?.my_auctions?.change && (
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <ArrowUp />
            <span>{data.my_auctions.change}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">عناصر المخزون</p>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{formatValue(data?.my_inventory_items?.value ?? 0)}</p>
          </div>
        </div>
        {data?.my_inventory_items?.change && (
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <ArrowUp />
            <span>{data.my_inventory_items.change}</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">المزادات المتاحة</p>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">{formatValue(data?.available_auctions?.value ?? 0)}</p>
          </div>
        </div>
        {data?.available_auctions?.change && (
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <ArrowUp />
            <span>{data.available_auctions.change}</span>
          </div>
        )}
      </div>
    </div>
  );
}
