"use client";
import React, { useState } from "react";
import { DownloadIcon } from "@/icons";
import Badge from "../ui/badge/Badge";
import { ArrowUpIcon } from "@/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface ReportCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, value, change, icon }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 md:p-6">
      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
        {icon}
      </div>
      <div className="flex items-end justify-between mt-5">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
            {value}
          </h4>
        </div>
        <Badge color="success">
          <ArrowUpIcon />
          {change}
        </Badge>
      </div>
    </div>
  );
};

interface SalesReport {
  orderId: string;
  customer: string;
  product: string;
  total: string;
  status: "قيد المعالجة" | "مكتمل";
  date: string;
}

const salesReports: SalesReport[] = [
  {
    orderId: "#8A2B4C",
    customer: "عميل 1",
    product: "خضروات",
    total: "89,99 ريال",
    status: "قيد المعالجة",
    date: "22/05/2025",
  },
  {
    orderId: "#8A5B6C",
    customer: "عميل 2",
    product: "فواكه",
    total: "59,60 ريال",
    status: "مكتمل",
    date: "01/08/2023",
  },
  {
    orderId: "#8A7D8E",
    customer: "عميل 3",
    product: "محاصيل",
    total: "120,50 ريال",
    status: "مكتمل",
    date: "15/09/2025",
  },
  {
    orderId: "#8A9F0A",
    customer: "عميل 4",
    product: "منتجات زراعية",
    total: "75,25 ريال",
    status: "قيد المعالجة",
    date: "10/10/2025",
  },
];

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("اكتوبر 2025");
  const [reportType, setReportType] = useState("تقرير المبيعات");
  const [productCategory, setProductCategory] = useState("جميع الفئات");

  const chartOptions: ApexOptions = {
    colors: ["#9C27B0", "#E1BEE7", "#CE93D8"],
    chart: {
      fontFamily: "Inter, sans-serif",
      type: "bar",
      height: 300,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: ["5 أكتوبر", "6 أكتوبر", "7 أكتوبر"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
        formatter: (val: number) => val.toString(),
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
      xaxis: {
        lines: {
          show: false,
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
    legend: {
      show: false,
    },
  };

  const chartSeries = [
    {
      name: "المبيعات",
      data: [45, 65, 80],
    },
    {
      name: "المشتريات",
      data: [35, 55, 70],
    },
    {
      name: "الإيرادات",
      data: [30, 50, 60],
    },
  ];

  const handleExportCSV = () => {
    // CSV export functionality
    const csvContent = [
      ["معرف الطلب", "العميل", "المنتج", "الاجمالي", "الحالة", "التاريخ"],
      ...salesReports.map((report) => [
        report.orderId,
        report.customer,
        report.product,
        report.total,
        report.status,
        report.date,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_report_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          تقارير المبيعات والمشتريات
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          انشاء وعرض وتصدير التقارير بناء على معايير مختلفة
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
        <ReportCard
          title="العناصر المباعة"
          value="1,234"
          change="5.3%+"
          icon={
            <svg
              className="text-gray-800 size-6 dark:text-white/90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          }
        />
        <ReportCard
          title="متوسط قيمة الطلب"
          value="1,234"
          change="5.3%+"
          icon={
            <svg
              className="text-gray-800 size-6 dark:text-white/90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          }
        />
        <ReportCard
          title="اجمالي الطلبات"
          value="1,234"
          change="5.3%+"
          icon={
            <svg
              className="text-gray-800 size-6 dark:text-white/90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <ReportCard
          title="اجمالي الإيرادات"
          value="1,234,567"
          change="5.3%+"
          icon={
            <svg
              className="text-gray-800 size-6 dark:text-white/90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              اتجاه المبيعات : 5 اكتوبر - 7 اكتوبر 2025
            </h3>
          </div>
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div id="salesTrendChart" className="min-w-[600px]">
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="bar"
                height={300}
              />
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            الفلاتر
          </h3>
          <div className="space-y-4">
            {/* Time Period Filters */}
            <div className="space-y-2">
              <button
                onClick={() => setSelectedPeriod("اخر اسبوع")}
                className={`w-full rounded-lg px-4 py-2.5 text-sm text-right transition-colors ${
                  selectedPeriod === "اخر اسبوع"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                اخر اسبوع
              </button>
              <button
                onClick={() => setSelectedPeriod("اخر 7 ايام")}
                className={`w-full rounded-lg px-4 py-2.5 text-sm text-right transition-colors ${
                  selectedPeriod === "اخر 7 ايام"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                اخر 7 ايام
              </button>
              <button
                onClick={() => setSelectedPeriod("هذا الشهر")}
                className={`w-full rounded-lg px-4 py-2.5 text-sm text-right transition-colors ${
                  selectedPeriod === "هذا الشهر"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                هذا الشهر
              </button>
              <button
                onClick={() => setSelectedPeriod("اكتوبر 2025")}
                className={`w-full rounded-lg px-4 py-2.5 text-sm text-right transition-colors ${
                  selectedPeriod === "اكتوبر 2025"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                اكتوبر 2025
              </button>
            </div>

            {/* Calendar Widget */}
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3 text-center text-sm font-semibold text-gray-800 dark:text-white/90">
                أكتوبر 2025
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["أ", "ب", "ج", "د", "ه", "و", "ز"].map((day) => (
                  <div
                    key={day}
                    className="py-2 font-medium text-gray-600 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
                {/* Empty cells for days before the 1st */}
                {Array.from({ length: 2 }, (_, i) => (
                  <div key={`empty-${i}`} className="py-2"></div>
                ))}
                {/* Days of the month */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <button
                    key={day}
                    className={`py-2 rounded transition-colors ${
                      day >= 5 && day <= 7
                        ? "bg-purple-500 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Report Type Dropdown */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                نوع التقرير
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="تقرير المبيعات">تقرير المبيعات</option>
                <option value="تقرير المشتريات">تقرير المشتريات</option>
                <option value="تقرير الإيرادات">تقرير الإيرادات</option>
              </select>
            </div>

            {/* Product Category Dropdown */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                فئة المنتج
              </label>
              <select
                value={productCategory}
                onChange={(e) => setProductCategory(e.target.value)}
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="جميع الفئات">جميع الفئات</option>
                <option value="خضروات">خضروات</option>
                <option value="فواكه">فواكه</option>
                <option value="محاصيل">محاصيل</option>
                <option value="منتجات زراعية">منتجات زراعية</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Sales Report Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            تقرير المبيعات المفصل
          </h3>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition-colors hover:bg-purple-600"
          >
            <DownloadIcon className="w-4 h-4" />
            تصدير ك CSV
          </button>
        </div>
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  معرف الطلب
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  العميل
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  المنتج
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  الاجمالي
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
              {salesReports.map((report, index) => (
                <TableRow key={index}>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {report.orderId}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {report.customer}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {report.product}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {report.total}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      size="sm"
                      color={report.status === "مكتمل" ? "success" : "warning"}
                    >
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                    {report.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

