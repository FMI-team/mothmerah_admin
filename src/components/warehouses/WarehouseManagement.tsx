"use client";
import { useState } from "react";
import { MoreDotIcon, DownloadIcon, ArrowUpIcon, CalenderIcon } from "@/icons";
import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface WarehouseItem {
  id: string;
  product: string;
  currentQuantity: string;
  remainingDays: string;
  status: "سليم" | "قريب الانتهاء" | "تالف";
  storageLocation: string;
  wasteQuantity: string;
  modificationDate: string;
}

const mockWarehouseItems: WarehouseItem[] = [
  {
    id: "1",
    product: "خضروات",
    currentQuantity: "250 طن",
    remainingDays: "5 ايام",
    status: "قريب الانتهاء",
    storageLocation: "الثلاجة",
    wasteQuantity: "15 طن",
    modificationDate: "12/02/2025",
  },
  {
    id: "2",
    product: "تمور",
    currentQuantity: "250 طن",
    remainingDays: "30 يوم",
    status: "سليم",
    storageLocation: "المستودع",
    wasteQuantity: "0 طن",
    modificationDate: "12/02/2025",
  },
  {
    id: "3",
    product: "فواكه",
    currentQuantity: "150 طن",
    remainingDays: "0 يوم",
    status: "تالف",
    storageLocation: "الثلاجة",
    wasteQuantity: "150 طن",
    modificationDate: "12/02/2025",
  },
  {
    id: "4",
    product: "فواكه",
    currentQuantity: "150 طن",
    remainingDays: "30 يوم",
    status: "سليم",
    storageLocation: "المستودع",
    wasteQuantity: "150 طن",
    modificationDate: "12/02/2025",
  },
];

const kpiCards = [
  {
    title: "محاصيل تالفة",
    value: "2",
    change: null,
    isError: true,
  },
  {
    title: "محاصيل قريبة الانتهاء",
    value: "6",
    change: "+1.3%",
  },
  {
    title: "اجمالي الكمية",
    value: "8,950 طن",
    change: "+1.3%",
  },
  {
    title: "اجمالي المحاصيل",
    value: "18",
    change: "+5.3%",
  },
];

export default function WarehouseManagement() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [cropStatusFilter, setCropStatusFilter] = useState("الكل");
  const [cropTypeFilter, setCropTypeFilter] = useState("الكل");
  const [storageLocationFilter, setStorageLocationFilter] = useState("الكل");
  
  const itemsPerPage = 4;
  const totalItems = 100;

  const paginatedItems = mockWarehouseItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === paginatedItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedItems.map((item) => item.id));
    }
  };

  const getStatusBadgeColor = (
    status: WarehouseItem["status"]
  ): "success" | "warning" | "error" | "info" | "primary" => {
    switch (status) {
      case "سليم":
        return "success";
      case "قريب الانتهاء":
        return "warning";
      case "تالف":
        return "error";
      default:
        return "primary";
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["المدصول", "الكمية الحالية", "الايام المتبقية", "الحالة", "موقع التخزين", "كمية الهدر", "تاريخ التعديل"],
      ...mockWarehouseItems.map((item) => [
        item.product,
        item.currentQuantity,
        item.remainingDays,
        item.status,
        item.storageLocation,
        item.wasteQuantity,
        item.modificationDate,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `warehouse_report_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Stacked Bar Chart Options
  const stackedBarChartOptions: ApexOptions = {
    chart: {
      type: "bar",
      height: 300,
      stacked: true,
      toolbar: {
        show: false,
      },
      fontFamily: "Outfit, sans-serif",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
      },
    },
    colors: ["#8B5CF6", "#C084FC", "#F59E0B"],
    xaxis: {
      categories: ["Jan", "Feb", "Mar", "Apr"],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      max: 30,
      title: {
        text: undefined,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: 1,
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
  };

  const stackedBarChartSeries = [
    {
      name: "خضروات",
      data: [10, 15, 12, 18],
    },
    {
      name: "فواكه",
      data: [5, 8, 6, 10],
    },
    {
      name: "تمور",
      data: [3, 5, 4, 7],
    },
  ];

  // Pie Chart Options
  const pieChartOptions: ApexOptions = {
    chart: {
      type: "pie",
      height: 300,
      fontFamily: "Outfit, sans-serif",
    },
    colors: ["#8B5CF6", "#EC4899", "#EF4444"],
    labels: ["سليم", "قريب الانتهاء", "تالف"],
    legend: {
      position: "right",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
    },
  };

  const pieChartSeries = [70, 20, 10];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          ادارة المخازن
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          ادارة كتالوج المنتجات وحالاتها ونوعها
        </p>
      </div>

      {/* Filters and Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث ..."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
            <svg
              className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={cropStatusFilter}
              onChange={(e) => setCropStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">حالة المحصول: الكل</option>
              <option value="سليم">سليم</option>
              <option value="قريب الانتهاء">قريب الانتهاء</option>
              <option value="تالف">تالف</option>
            </select>

            <select
              value={cropTypeFilter}
              onChange={(e) => setCropTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">نوع المحصول: الكل</option>
              <option value="خضروات">خضروات</option>
              <option value="تمور">تمور</option>
              <option value="فواكه">فواكه</option>
            </select>

            <select
              value={storageLocationFilter}
              onChange={(e) => setStorageLocationFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">موقع التخزين: الكل</option>
              <option value="الثلاجة">الثلاجة</option>
              <option value="المستودع">المستودع</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <p
                  className={`mt-2 text-2xl font-bold ${
                    card.isError
                      ? "text-error-600 dark:text-error-500"
                      : "text-gray-800 dark:text-white/90"
                  }`}
                >
                  {card.value}
                </p>
              </div>
            </div>
            {card.change && (
              <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
                <ArrowUpIcon className="h-4 w-4" />
                <span>{card.change}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stacked Bar Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            اجمالي هدر المحاصيل حسب النوع
          </h3>
          <ReactApexChart
            options={stackedBarChartOptions}
            series={stackedBarChartSeries}
            type="bar"
            height={300}
          />
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            اجمالي المحاصيل حسب الحالة
          </h3>
          <ReactApexChart
            options={pieChartOptions}
            series={pieChartSeries}
            type="pie"
            height={300}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={handleExportCSV}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <DownloadIcon className="w-4 h-4 inline-block ml-2" />
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
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        paginatedItems.length > 0 &&
                        selectedItems.length === paginatedItems.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    المدصول
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  الكمية الحالية
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  الايام المتبقية
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
                  موقع التخزين
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  كمية الهدر
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  تاريخ التعديل
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  الاجراءات
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {item.product}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {item.currentQuantity}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {item.remainingDays}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getStatusBadgeColor(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {item.storageLocation}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {item.wasteQuantity}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {item.modificationDate}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionDropdownOpen(
                            actionDropdownOpen === item.id ? null : item.id
                          )
                        }
                        className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <MoreDotIcon className="w-5 h-5" />
                      </button>
                      <Dropdown
                        isOpen={actionDropdownOpen === item.id}
                        onClose={() => setActionDropdownOpen(null)}
                        className="absolute left-0 mt-2 w-40 p-2 z-50"
                      >
                        <DropdownItem
                          onItemClick={() => {
                            setActionDropdownOpen(null);
                          }}
                          className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                          عرض التفاصيل
                        </DropdownItem>
                        <DropdownItem
                          onItemClick={() => {
                            setActionDropdownOpen(null);
                          }}
                          className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                          تعديل
                        </DropdownItem>
                        <DropdownItem
                          onItemClick={() => {
                            setActionDropdownOpen(null);
                          }}
                          className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                        >
                          حذف
                        </DropdownItem>
                      </Dropdown>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-4 pt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            عرض {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
            {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              السابق
            </button>
            {[1, 2].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-purple-500 text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

