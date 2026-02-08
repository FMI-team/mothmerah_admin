"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreDotIcon, PlusIcon, DownloadIcon, ArrowUpIcon } from "@/icons";
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
import { getAuthHeader } from "../../../services/auth";
import CreateAuctionForm from "./CreateAuctionForm";

interface Translation {
  language_code: string;
  translated_status_name?: string;
  translated_type_name?: string;
  translated_category_name?: string;
  translated_product_name?: string;
  translated_description?: string | null;
}

interface AuctionStatus {
  status_name_key: string;
  status_description_key: string | null;
  auction_status_id: number;
  translations: Translation[];
}

interface AuctionType {
  type_name_key: string;
  description_key: string;
  auction_type_id: number;
  translations: Translation[];
}

interface Category {
  category_name_key: string;
  category_id: number;
  translations: Translation[];
}

interface Product {
  product_id: string;
  category: Category;
  translations: Array<{
    language_code: string;
    translated_product_name?: string;
  }>;
}

interface ApiAuction {
  seller_user_id: string;
  product_id: string;
  auction_type_id: number;
  auction_status_id: number;
  auction_title_key: string | null;
  custom_auction_title: string | null;
  auction_description_key: string | null;
  custom_auction_description: string | null;
  start_timestamp: string;
  end_timestamp: string;
  starting_price_per_unit: number;
  minimum_bid_increment: number;
  reserve_price_per_unit: number | null;
  quantity_offered: number;
  unit_of_measure_id_for_quantity: number;
  is_private_auction: boolean;
  pre_arrival_shipping_info: string | null;
  cancellation_reason: string | null;
  current_highest_bid_amount_per_unit: number | null;
  current_highest_bidder_user_id: string | null;
  total_bids_count: number;
  auction_id: string;
  created_at: string;
  updated_at: string;
  product: Product;
  auction_type: AuctionType;
  auction_status: AuctionStatus;
}

const getArabicTranslation = (
  translations: Translation[],
  field: "translated_status_name" | "translated_type_name" | "translated_category_name" | "translated_product_name"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

export default function AuctionManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedAuctions, setSelectedAuctions] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [auctions, setAuctions] = useState<ApiAuction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingAuctionId, setDeletingAuctionId] = useState<string | null>(null);
  const [isCreateAuctionModalOpen, setIsCreateAuctionModalOpen] = useState(false);

  const itemsPerPage = 6;

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/auctions/me/created", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      if (!response.ok) {
        throw new Error("فشل في جلب المزادات");
      }

      const data: ApiAuction[] = await response.json();
      setAuctions(data || []);
    } catch (err) {
      console.error("Error fetching auctions:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ في جلب بيانات المزادات"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المزاد؟")) return;
    setDeletingAuctionId(auctionId);
    setActionDropdownOpen(null);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `https://api-testing.mothmerah.sa/api/v1/auctions/${auctionId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { detail?: string })?.detail || "فشل في حذف المزاد"
        );
      }
      await fetchAuctions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ في حذف المزاد"
      );
    } finally {
      setDeletingAuctionId(null);
    }
  };

  const paginatedAuctions = auctions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalItems = auctions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

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
      setSelectedAuctions(paginatedAuctions.map((auction) => auction.auction_id));
    }
  };

  const getStatusBadgeColor = (
    statusName: string
  ): "success" | "warning" | "error" | "info" | "primary" => {
    const status = statusName.toLowerCase();
    if (status === "active" || status === "نشط" || status === "scheduled" || status === "مجدول") {
      return "success";
    }
    if (status.includes("pending") || status.includes("قيد")) {
      return "warning";
    }
    if (status === "ended" || status === "منتهي" || status === "closed") {
      return "info";
    }
    return "warning";
  };

  // Calculate statistics from actual data
  const statisticsCards = [
    {
      title: "اجمالي عدد المزادات",
      value: auctions.length.toString(),
      change: "",
    },
    {
      title: "اجمالي عدد المزادات القائمة",
      value: auctions.filter((a) => a.auction_status.status_name_key === "ACTIVE").length.toString(),
      change: "",
    },
    {
      title: "اجمالي عدد المزادات المجدولة",
      value: auctions.filter((a) => a.auction_status.status_name_key === "SCHEDULED").length.toString(),
      change: "",
    },
    {
      title: "اجمالي عدد المزادات المنتهية",
      value: auctions.filter((a) => a.auction_status.status_name_key === "ENDED" || a.auction_status.status_name_key === "CLOSED").length.toString(),
      change: "",
    },
    {
      title: "إجمالي المزايدات",
      value: auctions.reduce((sum, a) => sum + a.total_bids_count, 0).toString(),
      change: "",
    },
    {
      title: "متوسط السعر الابتدائي",
      value: auctions.length > 0
        ? (auctions.reduce((sum, a) => sum + a.starting_price_per_unit, 0) / auctions.length).toFixed(2)
        : "0",
      change: "",
    },
  ];

  const handleExportCSV = () => {
    const csvContent = [
      ["عنوان المزاد", "المنتج", "الفئة", "نوع المزاد", "الحالة", "السعر الابتدائي", "أعلى مزايدة", "عدد المزايدات", "الكمية", "تاريخ البدء", "تاريخ الانتهاء"],
      ...auctions.map((auction) => [
        auction.custom_auction_title || "بدون عنوان",
        getArabicTranslation(auction.product.translations, "translated_product_name") || auction.product.product_id,
        getArabicTranslation(auction.product.category.translations, "translated_category_name") || auction.product.category.category_name_key,
        getArabicTranslation(auction.auction_type.translations, "translated_type_name") || auction.auction_type.type_name_key,
        getArabicTranslation(auction.auction_status.translations, "translated_status_name") || auction.auction_status.status_name_key,
        auction.starting_price_per_unit.toString(),
        (auction.current_highest_bid_amount_per_unit || auction.starting_price_per_unit).toString(),
        auction.total_bids_count.toString(),
        auction.quantity_offered.toString(),
        formatDate(auction.start_timestamp),
        formatDate(auction.end_timestamp),
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

      {error && (
        <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
          {error}
        </div>
      )}

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
            {card.change && (
              <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
                <ArrowUpIcon className="h-4 w-4" />
                <span>{card.change}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <Button
            size="sm"
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => setIsCreateAuctionModalOpen(true)}
          >
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
                    عنوان المزاد
                  </div>
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
                  الفئة
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
                  عدد المزايدات
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
                  السعر الابتدائي
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  أعلى مزايدة
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  تاريخ البدء
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  تاريخ الانتهاء
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
              {isLoading ? (
                <TableRow>
                  <TableCell className="py-12 text-center text-gray-500 dark:text-gray-400">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : paginatedAuctions.length === 0 ? (
                <TableRow>
                  <TableCell className="py-12 text-center text-gray-500 dark:text-gray-400">
                    لا توجد مزادات متاحة
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAuctions.map((auction) => {
                  const statusName = getArabicTranslation(
                    auction.auction_status.translations,
                    "translated_status_name"
                  ) || auction.auction_status.status_name_key;
                  const typeName = getArabicTranslation(
                    auction.auction_type.translations,
                    "translated_type_name"
                  ) || auction.auction_type.type_name_key;
                  const productName = getArabicTranslation(
                    auction.product.translations,
                    "translated_product_name"
                  ) || auction.product.product_id;
                  const categoryName = getArabicTranslation(
                    auction.product.category.translations,
                    "translated_category_name"
                  ) || auction.product.category.category_name_key;

                  return (
                    <TableRow
                      key={auction.auction_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedAuctions.includes(auction.auction_id)}
                            onChange={() => toggleAuctionSelection(auction.auction_id)}
                            className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                          />
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {auction.custom_auction_title || "بدون عنوان"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {productName}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {categoryName}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {typeName}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {auction.total_bids_count}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge size="sm" color={getStatusBadgeColor(statusName)}>
                          {statusName}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {auction.starting_price_per_unit.toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {(auction.current_highest_bid_amount_per_unit || auction.starting_price_per_unit).toFixed(2)} ر.س
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDate(auction.start_timestamp)}
                      </TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {formatDate(auction.end_timestamp)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionDropdownOpen(
                                actionDropdownOpen === auction.auction_id ? null : auction.auction_id
                              )
                            }
                            className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            <MoreDotIcon className="w-5 h-5" />
                          </button>
                          <Dropdown
                            isOpen={actionDropdownOpen === auction.auction_id}
                            onClose={() => setActionDropdownOpen(null)}
                            className="absolute left-0 mt-2 w-40 p-2 z-50"
                          >
                            <DropdownItem
                              onItemClick={() => {
                                setActionDropdownOpen(null);
                                router.push(`${pathname}/${auction.auction_id}`);
                              }}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              عرض التفاصيل
                            </DropdownItem>
                            <DropdownItem
                              onItemClick={() => {
                                setActionDropdownOpen(null);
                                router.push(`${pathname}/${auction.auction_id}/edit`);
                              }}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              تعديل
                            </DropdownItem>
                            <DropdownItem
                              onItemClick={() => {
                                handleDeleteAuction(auction.auction_id);
                              }}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                            >
                              {deletingAuctionId === auction.auction_id
                                ? "جاري الحذف..."
                                : "حذف"}
                            </DropdownItem>
                          </Dropdown>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
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
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${currentPage === page
                      ? "bg-purple-500 text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateAuctionForm
        isOpen={isCreateAuctionModalOpen}
        onClose={() => setIsCreateAuctionModalOpen(false)}
        onSuccess={fetchAuctions}
      />
    </div>
  );
}

