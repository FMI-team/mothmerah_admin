"use client";
import { useState, useEffect, useCallback } from "react";
import { MoreDotIcon, PlusIcon, DownloadIcon, ArrowUpIcon, CalenderIcon } from "@/icons";
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
import Button from "../ui/button/Button";
import { getAuthHeader } from "@/lib/auth";

interface Auction {
  id: string;
  auctionNumber: string;
  auctionType: "حضوري" | "عن بعد";
  cropType: string;
  numberOfOffers: number;
  status: "قائم" | "منتهي" | "قادم";
  productArrivalStatus: "مؤكد" | "غير مؤكد";
  startDate: string;
}

interface AuctionStatusTranslation {
  language_code: string;
  translated_status_name?: string;
  translated_description?: string | null;
}

interface AuctionStatus {
  status_name_key: string;
  status_description_key: string;
  auction_status_id: number;
  translations: AuctionStatusTranslation[];
}

interface AuctionTypeTranslation {
  language_code: string;
  translated_type_name?: string;
  translated_description?: string | null;
}

interface AuctionType {
  type_name_key: string;
  description_key: string;
  auction_type_id: number;
  translations: AuctionTypeTranslation[];
}

const mockAuctions: Auction[] = [
  {
    id: "1",
    auctionNumber: "#102",
    auctionType: "حضوري",
    cropType: "خضروات",
    numberOfOffers: 2,
    status: "قائم",
    productArrivalStatus: "مؤكد",
    startDate: "22/05/2025",
  },
  {
    id: "2",
    auctionNumber: "#103",
    auctionType: "عن بعد",
    cropType: "تمور",
    numberOfOffers: 5,
    status: "منتهي",
    productArrivalStatus: "مؤكد",
    startDate: "01/08/2023",
  },
  {
    id: "3",
    auctionNumber: "#104",
    auctionType: "حضوري",
    cropType: "غذائي",
    numberOfOffers: 0,
    status: "قادم",
    productArrivalStatus: "غير مؤكد",
    startDate: "05/09/2022",
  },
  {
    id: "4",
    auctionNumber: "#105",
    auctionType: "عن بعد",
    cropType: "فواكه",
    numberOfOffers: 3,
    status: "قائم",
    productArrivalStatus: "مؤكد",
    startDate: "22/05/2025",
  },
  {
    id: "5",
    auctionNumber: "#106",
    auctionType: "حضوري",
    cropType: "خضروات",
    numberOfOffers: 7,
    status: "منتهي",
    productArrivalStatus: "مؤكد",
    startDate: "01/08/2023",
  },
  {
    id: "6",
    auctionNumber: "#107",
    auctionType: "عن بعد",
    cropType: "تمور",
    numberOfOffers: 4,
    status: "منتهي",
    productArrivalStatus: "مؤكد",
    startDate: "05/09/2022",
  },
];

const statisticsCards = [
  {
    title: "اجمالي عدد المزادات",
    value: "123,457",
    change: "+5.3%",
  },
  {
    title: "اجمالي عدد المزادات الحضورية",
    value: "8,950",
    change: "+1.3%",
  },
  {
    title: "اجمالي عدد المزادات القائمة",
    value: "2,084",
    change: "+1.3%",
  },
  {
    title: "اجمالي عدد المزادات عبر التطبيق",
    value: "5,078",
    change: "+1.3%",
  },
  {
    title: "اجمالي عدد المزادات المنتهية",
    value: "1,352",
    change: "+1.3%",
  },
  {
    title: "اجمالي عدد المزادات القادمة",
    value: "13",
    change: "+1.3%",
  },
];

const getArabicTranslation = (
  translations: AuctionStatusTranslation[],
  field: "translated_status_name" | "translated_description"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

const getAuctionTypeArabicTranslation = (
  translations: AuctionTypeTranslation[],
  field: "translated_type_name" | "translated_description"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

export default function AuctionManagement() {
  const [selectedAuctions, setSelectedAuctions] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [auctionTypeFilter, setAuctionTypeFilter] = useState("الكل");
  const [cropTypeFilter, setCropTypeFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [startDateFilter, setStartDateFilter] = useState("18/02/2025");
  const [endDateFilter, setEndDateFilter] = useState("12/02/2025");
  const [auctionStatuses, setAuctionStatuses] = useState<AuctionStatus[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [auctionTypes, setAuctionTypes] = useState<AuctionType[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  
  const itemsPerPage = 6;
  const totalItems = 100;

  const fetchAuctionStatuses = useCallback(async () => {
    setIsLoadingStatuses(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        "http://127.0.0.1:8000/admin/admin/auctions/statuses",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب حالات المزادات");
      }

      const data: AuctionStatus[] = await response.json();
      setAuctionStatuses(data);
    } catch (err) {
      console.error("Error fetching auction statuses:", err);
    } finally {
      setIsLoadingStatuses(false);
    }
  }, []);

  const fetchAuctionTypes = useCallback(async () => {
    setIsLoadingTypes(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        "http://127.0.0.1:8000/admin/admin/auctions/types",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        throw new Error("فشل في جلب أنواع المزادات");
      }

      const data: AuctionType[] = await response.json();
      setAuctionTypes(data);
    } catch (err) {
      console.error("Error fetching auction types:", err);
    } finally {
      setIsLoadingTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctionStatuses();
    fetchAuctionTypes();
  }, [fetchAuctionStatuses, fetchAuctionTypes]);

  const paginatedAuctions = mockAuctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleAuctionSelection = (auctionId: string) => {
    setSelectedAuctions((prev) =>
      prev.includes(auctionId)
        ? prev.filter((id) => id !== auctionId)
        : [...prev, auctionId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedAuctions.length === paginatedAuctions.length) {
      setSelectedAuctions([]);
    } else {
      setSelectedAuctions(paginatedAuctions.map((auction) => auction.id));
    }
  };

  const getStatusBadgeColor = (
    status: Auction["status"]
  ): "success" | "warning" | "error" | "info" | "primary" => {
    switch (status) {
      case "قائم":
        return "success";
      case "منتهي":
        return "info";
      case "قادم":
        return "warning";
      default:
        return "primary";
    }
  };

  const getArrivalStatusBadgeColor = (
    status: Auction["productArrivalStatus"]
  ): "success" | "warning" | "error" | "info" | "primary" => {
    switch (status) {
      case "مؤكد":
        return "success";
      case "غير مؤكد":
        return "warning";
      default:
        return "primary";
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["رقم المزاد", "نوع المزاد", "نوع المحصول", "عدد العروض", "الحالة", "حالة وصول المنتج", "تاريخ بداية المزاد"],
      ...mockAuctions.map((auction) => [
        auction.auctionNumber,
        auction.auctionType,
        auction.cropType,
        auction.numberOfOffers.toString(),
        auction.status,
        auction.productArrivalStatus,
        auction.startDate,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `auctions_report_${new Date().getTime()}.csv`);
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
          ادارة المزادات
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          ادارة المزادات وحالتها ونوعها
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
              value={auctionTypeFilter}
              onChange={(e) => setAuctionTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
              disabled={isLoadingTypes}
            >
              <option value="الكل">نوع المزاد: الكل</option>
              {auctionTypes.map((type) => {
                const typeName = getAuctionTypeArabicTranslation(
                  type.translations,
                  "translated_type_name"
                ) || type.type_name_key;
                return (
                  <option key={type.auction_type_id} value={type.type_name_key}>
                    {typeName}
                  </option>
                );
              })}
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
              <option value="غذائي">غذائي</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
              disabled={isLoadingStatuses}
            >
              <option value="الكل">الحالة: الكل</option>
              {auctionStatuses.map((status) => {
                const statusName = getArabicTranslation(
                  status.translations,
                  "translated_status_name"
                ) || status.status_name_key;
                return (
                  <option key={status.auction_status_id} value={status.status_name_key}>
                    {statusName}
                  </option>
                );
              })}
            </select>

            <div className="relative">
              <input
                type="text"
                value={startDateFilter}
                onChange={(e) => setStartDateFilter(e.target.value)}
                placeholder="تاريخ بداية المزاد"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <CalenderIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="relative">
              <input
                type="text"
                value={endDateFilter}
                onChange={(e) => setEndDateFilter(e.target.value)}
                placeholder="تاريخ نهاية المزاد"
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <CalenderIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statisticsCards.map((card, index) => (
          <div
            key={index}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                  {card.value}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
              <ArrowUpIcon className="h-4 w-4" />
              <span>{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
            <PlusIcon className="w-4 h-4 ml-2" />
            انشاء مزاد
          </Button>
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
            <TableHeader className="border-gray-100 dark:border-gray-800 border-y bg-purple-50 dark:bg-purple-900/10">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        paginatedAuctions.length > 0 &&
                        selectedAuctions.length === paginatedAuctions.length
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    رقم المزاد
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  نوع المزاد
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  نوع المحصول
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  عدد العروض
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
                  حالة وصول المنتج
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  تاريخ بداية المزاد
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
              {paginatedAuctions.map((auction) => (
                <TableRow
                  key={auction.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedAuctions.includes(auction.id)}
                        onChange={() => toggleAuctionSelection(auction.id)}
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                      <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {auction.auctionNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {auction.auctionType}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {auction.cropType}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {auction.numberOfOffers}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getStatusBadgeColor(auction.status)}>
                      {auction.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      size="sm"
                      color={getArrivalStatusBadgeColor(auction.productArrivalStatus)}
                    >
                      {auction.productArrivalStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {auction.startDate}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionDropdownOpen(
                            actionDropdownOpen === auction.id ? null : auction.id
                          )
                        }
                        className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <MoreDotIcon className="w-5 h-5" />
                      </button>
                      <Dropdown
                        isOpen={actionDropdownOpen === auction.id}
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

