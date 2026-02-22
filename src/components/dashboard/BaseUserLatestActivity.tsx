"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { UserCircleIcon } from "@/icons";
import { getBaseUserLatestActivity, type BaseUserActivityItem } from "../../../services/dashboard";

const getStatusBadgeColor = (status: string): "warning" | "success" | "info" => {
  const s = status.toUpperCase();
  if (s.includes("DRAFT") || s.includes("PENDING") || s.includes("قيد")) return "warning";
  if (s.includes("ACTIVE") || s.includes("COMPLETED") || s.includes("مكتمل")) return "success";
  return "info";
};

export default function BaseUserLatestActivity() {
  const [activities, setActivities] = useState<BaseUserActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBaseUserLatestActivity();
      if (response.status === 200 && Array.isArray(response.data)) {
        setActivities(response.data);
      } else {
        setError("فشل تحميل النشاط الأخير");
      }
    } catch {
      setError("فشل تحميل النشاط الأخير");
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">النشاط الأخير</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">آخر منتجاتك ومزاداتك</p>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-4">
              <div className="h-10 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-10 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-10 w-20 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 py-4 text-center dark:border-red-900/50 dark:bg-red-950/30">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : activities.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
          لا يوجد نشاط حديث
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">النشاط</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">معرف العنصر</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الحالة</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">التاريخ</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {activities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center text-purple-500">
                        <UserCircleIcon className="size-6" />
                      </div>
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{activity.activity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{activity.itemId}</TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getStatusBadgeColor(activity.status)}>{activity.status}</Badge>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">{activity.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}