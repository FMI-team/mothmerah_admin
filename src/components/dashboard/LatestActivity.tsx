"use client";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { UserCircleIcon } from "@/icons";

interface Activity {
  id: number;
  user: string;
  activity: string;
  itemId: string;
  status: "قيد المعالجة" | "مكتمل" | "تم الشحن";
  date: string;
}

const activityData: Activity[] = [
  {
    id: 1,
    user: "اسم المستخدم 1",
    activity: "طلب جديد",
    itemId: "ORD-12345#",
    status: "قيد المعالجة",
    date: "22/05/2025",
  },
  {
    id: 2,
    user: "اسم المستخدم 2",
    activity: "تسجيل مستخدم جديد",
    itemId: "USR-60225#",
    status: "مكتمل",
    date: "01/08/2023",
  },
  {
    id: 3,
    user: "اسم المستخدم 3",
    activity: "طلب جديد",
    itemId: "ORD-25344#",
    status: "تم الشحن",
    date: "05/09/2022",
  },
];

const getStatusBadgeColor = (
  status: Activity["status"]
): "warning" | "success" => {
  switch (status) {
    case "قيد المعالجة":
      return "warning";
    case "مكتمل":
      return "success";
    case "تم الشحن":
      return "success";
    default:
      return "success";
  }
};

export default function LatestActivity() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          النشاط الاخير
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          سجل باخر تسجيلات المستخدمين و الطلبات
        </p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                المستخدم
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                النشاط
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                معرف العنصر
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                الحالة
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                التاريخ
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {activityData.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 text-purple-500">
                      <UserCircleIcon className="size-6" />
                    </div>
                    <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {activity.user}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                  {activity.activity}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {activity.itemId}
                </TableCell>
                <TableCell className="py-3">
                  <Badge
                    size="sm"
                    color={getStatusBadgeColor(activity.status)}
                  >
                    {activity.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {activity.date}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

