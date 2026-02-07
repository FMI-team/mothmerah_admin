"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MoreDotIcon, PlusIcon, DownloadIcon, ArrowUpIcon, PencilIcon } from "@/icons";
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
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import { getAuthHeader } from "@/lib/auth";
import CreateAuctionForm from "./CreateAuctionForm";

const API_BASE = "http://127.0.0.1:8000";

interface Translation {
  language_code: string;
  translated_status_name?: string;
  translated_type_name?: string;
  translated_category_name?: string;
  translated_product_name?: string;
  translated_description?: string | null;
}

/** Form item for status create/update */
interface StatusTranslationFormItem {
  language_code: string;
  translated_status_name: string;
}

const LANGUAGE_OPTIONS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" },
];

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

export default function AdminAuctionManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedAuctions, setSelectedAuctions] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [auctions, setAuctions] = useState<ApiAuction[]>([]);
  const [auctionStatuses, setAuctionStatuses] = useState<AuctionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingAuctionId, setDeletingAuctionId] = useState<string | null>(null);
  const [isCreateAuctionModalOpen, setIsCreateAuctionModalOpen] = useState(false);
  const [isCreateStatusModalOpen, setIsCreateStatusModalOpen] = useState(false);
  const [newStatusNameKey, setNewStatusNameKey] = useState("");
  const [newStatusTranslations, setNewStatusTranslations] = useState<StatusTranslationFormItem[]>([
    { language_code: "ar", translated_status_name: "" },
  ]);
  const [createStatusError, setCreateStatusError] = useState<string | null>(null);
  const [createStatusSubmitting, setCreateStatusSubmitting] = useState(false);
  const [editingStatus, setEditingStatus] = useState<AuctionStatus | null>(null);
  const [editStatusNameKey, setEditStatusNameKey] = useState("");
  const [editStatusTranslations, setEditStatusTranslations] = useState<StatusTranslationFormItem[]>([]);
  const [updateStatusError, setUpdateStatusError] = useState<string | null>(null);
  const [updateStatusSubmitting, setUpdateStatusSubmitting] = useState(false);
  const [deletingStatusId, setDeletingStatusId] = useState<number | null>(null);

  const itemsPerPage = 6;

  const fetchAuctionStatuses = useCallback(async () => {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${API_BASE}/admin/admin/auctions/statuses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      if (!response.ok) return;
      const data: AuctionStatus[] = await response.json();
      setAuctionStatuses(Array.isArray(data) ? data : []);
    } catch {
      setAuctionStatuses([]);
    }
  }, []);

  const fetchAuctions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${API_BASE}/api/v1/auctions/`, {
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
      setAuctions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuctionStatuses();
  }, [fetchAuctionStatuses]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  const openCreateStatusModal = () => {
    setNewStatusNameKey("");
    setNewStatusTranslations([{ language_code: "ar", translated_status_name: "" }]);
    setCreateStatusError(null);
    setIsCreateStatusModalOpen(true);
  };

  const closeCreateStatusModal = () => {
    setIsCreateStatusModalOpen(false);
    setNewStatusNameKey("");
    setNewStatusTranslations([{ language_code: "ar", translated_status_name: "" }]);
    setCreateStatusError(null);
  };

  const addNewStatusTranslation = () => {
    const used = newStatusTranslations.map((t) => t.language_code);
    const next = LANGUAGE_OPTIONS.find((o) => !used.includes(o.value));
    if (next) setNewStatusTranslations((prev) => [...prev, { language_code: next.value, translated_status_name: "" }]);
  };

  const removeNewStatusTranslation = (index: number) => {
    if (newStatusTranslations.length <= 1) return;
    setNewStatusTranslations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateNewStatusTranslation = (index: number, field: keyof StatusTranslationFormItem, value: string) => {
    setNewStatusTranslations((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const openEditStatusModal = (status: AuctionStatus) => {
    setEditingStatus(status);
    setEditStatusNameKey(status.status_name_key);
    setEditStatusTranslations(
      status.translations?.length > 0
        ? status.translations.map((t) => ({
            language_code: t.language_code,
            translated_status_name: t.translated_status_name ?? "",
          }))
        : [{ language_code: "ar", translated_status_name: "" }]
    );
    setUpdateStatusError(null);
  };

  const closeEditStatusModal = () => {
    setEditingStatus(null);
    setEditStatusNameKey("");
    setEditStatusTranslations([]);
    setUpdateStatusError(null);
  };

  const addEditStatusTranslation = () => {
    const used = editStatusTranslations.map((t) => t.language_code);
    const next = LANGUAGE_OPTIONS.find((o) => !used.includes(o.value));
    if (next) setEditStatusTranslations((prev) => [...prev, { language_code: next.value, translated_status_name: "" }]);
  };

  const removeEditStatusTranslation = (index: number) => {
    if (editStatusTranslations.length <= 1) return;
    setEditStatusTranslations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEditStatusTranslation = (index: number, field: keyof StatusTranslationFormItem, value: string) => {
    setEditStatusTranslations((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  };

  const handleDeleteAuctionStatus = async (status: AuctionStatus) => {
    const label = getArabicTranslation(status.translations, "translated_status_name") || status.status_name_key;
    if (!confirm(`هل أنت متأكد من حذف الحالة "${label}"؟`)) return;
    setDeletingStatusId(status.auction_status_id);
    if (editingStatus?.auction_status_id === status.auction_status_id) closeEditStatusModal();
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `${API_BASE}/admin/admin/auctions/statuses/${status.auction_status_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = Array.isArray((errBody as { detail?: unknown }).detail)
          ? (errBody as { detail: { msg?: string }[] }).detail.map((d) => d.msg).filter(Boolean).join(" — ")
          : (errBody as { detail?: string }).detail || (errBody as { message?: string }).message || "فشل حذف الحالة";
        throw new Error(msg);
      }
      await fetchAuctionStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل حذف الحالة");
    } finally {
      setDeletingStatusId(null);
    }
  };

  const handleUpdateAuctionStatus = async () => {
    const trimmedKey = editStatusNameKey.trim();
    const validTranslations = editStatusTranslations.filter(
      (t) => t.language_code.trim() && t.translated_status_name.trim()
    );
    if (!editingStatus || !trimmedKey) {
      setUpdateStatusError("مفتاح اسم الحالة مطلوب");
      return;
    }
    if (validTranslations.length === 0) {
      setUpdateStatusError("يجب إضافة ترجمة واحدة على الأقل (لغة واسم الحالة)");
      return;
    }
    setUpdateStatusError(null);
    setUpdateStatusSubmitting(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `${API_BASE}/admin/admin/auctions/statuses/${editingStatus.auction_status_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({
            status_name_key: trimmedKey,
            translations: validTranslations.map((t) => ({
              language_code: t.language_code.trim(),
              translated_status_name: t.translated_status_name.trim(),
            })),
          }),
        }
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = Array.isArray((errBody as { detail?: unknown }).detail)
          ? (errBody as { detail: { msg?: string }[] }).detail.map((d) => d.msg).filter(Boolean).join(" — ")
          : (errBody as { detail?: string }).detail || (errBody as { message?: string }).message || "فشل تحديث الحالة";
        throw new Error(msg);
      }
      await fetchAuctionStatuses();
      closeEditStatusModal();
    } catch (err) {
      setUpdateStatusError(err instanceof Error ? err.message : "فشل تحديث الحالة");
    } finally {
      setUpdateStatusSubmitting(false);
    }
  };

  const handleCreateAuctionStatus = async () => {
    const trimmedKey = newStatusNameKey.trim();
    const validTranslations = newStatusTranslations.filter(
      (t) => t.language_code.trim() && t.translated_status_name.trim()
    );
    if (!trimmedKey) {
      setCreateStatusError("مفتاح اسم الحالة مطلوب");
      return;
    }
    if (validTranslations.length === 0) {
      setCreateStatusError("يجب إضافة ترجمة واحدة على الأقل (لغة واسم الحالة)");
      return;
    }
    setCreateStatusError(null);
    setCreateStatusSubmitting(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${API_BASE}/admin/admin/auctions/statuses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          status_name_key: trimmedKey,
          translations: validTranslations.map((t) => ({
            language_code: t.language_code.trim(),
            translated_status_name: t.translated_status_name.trim(),
          })),
        }),
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const msg = Array.isArray((errBody as { detail?: unknown }).detail)
          ? (errBody as { detail: { msg?: string }[] }).detail.map((d) => d.msg).filter(Boolean).join(" — ")
          : (errBody as { detail?: string }).detail || (errBody as { message?: string }).message || "فشل إنشاء الحالة";
        throw new Error(msg);
      }
      await fetchAuctionStatuses();
      closeCreateStatusModal();
    } catch (err) {
      setCreateStatusError(err instanceof Error ? err.message : "فشل إنشاء الحالة");
    } finally {
      setCreateStatusSubmitting(false);
    }
  };

  const handleDeleteAuction = async (auctionId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المزاد؟")) return;
    setDeletingAuctionId(auctionId);
    setActionDropdownOpen(null);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${API_BASE}/api/v1/auctions/${auctionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
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

  const statisticsCards = (() => {
    const totalAuctions = auctions.length;
    const statusCards =
      auctionStatuses.length > 0
        ? auctionStatuses.map((status) => ({
            title: `عدد المزادات (${getArabicTranslation(status.translations, "translated_status_name") || status.status_name_key})`,
            value: auctions.filter((a) => a.auction_status.auction_status_id === status.auction_status_id).length.toString(),
            change: "",
          }))
        : [
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
          ];
    return [
      {
        title: "اجمالي عدد المزادات",
        value: totalAuctions.toString(),
        change: "",
      },
      ...statusCards,
      {
        title: "إجمالي المزايدات",
        value: auctions.reduce((sum, a) => sum + a.total_bids_count, 0).toString(),
        change: "",
      },
      {
        title: "متوسط السعر الابتدائي",
        value: totalAuctions > 0
          ? (auctions.reduce((sum, a) => sum + a.starting_price_per_unit, 0) / totalAuctions).toFixed(2)
          : "0",
        change: "",
      },
    ];
  })();

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
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          ادارة المزادات (لوحة الإدارة)
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

      {auctionStatuses.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            حالات المزاد
          </h3>
          <ul className="space-y-2">
            {auctionStatuses.map((status) => (
              <li
                key={status.auction_status_id}
                className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 py-2.5 px-3 dark:border-gray-800"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {getArabicTranslation(status.translations, "translated_status_name") || status.status_name_key}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {status.status_name_key}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditStatusModal(status)}
                    disabled={deletingStatusId === status.auction_status_id}
                  >
                    <PencilIcon className="w-4 h-4 ml-1.5" />
                    تعديل
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteAuctionStatus(status)}
                    disabled={deletingStatusId === status.auction_status_id}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    {deletingStatusId === status.auction_status_id ? "جاري الحذف..." : "حذف"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-purple-500 hover:bg-purple-600"
              onClick={() => setIsCreateAuctionModalOpen(true)}
            >
              <PlusIcon className="w-4 h-4 ml-2" />
              انشاء مزاد
            </Button>
            <Button size="sm" variant="outline" onClick={openCreateStatusModal}>
              إضافة حالة مزاد
            </Button>
          </div>
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
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
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
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">المنتج</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الفئة</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">نوع المزاد</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">عدد المزايدات</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الحالة</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">السعر الابتدائي</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">أعلى مزايدة</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">تاريخ البدء</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">تاريخ الانتهاء</TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الاجراءات</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <TableRow>
                  <td colSpan={11} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    جاري التحميل...
                  </td>
                </TableRow>
              ) : paginatedAuctions.length === 0 ? (
                <TableRow>
                  <td colSpan={11} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    لا توجد مزادات متاحة
                  </td>
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
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{productName}</TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{categoryName}</TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{typeName}</TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{auction.total_bids_count}</TableCell>
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
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(auction.start_timestamp)}</TableCell>
                      <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(auction.end_timestamp)}</TableCell>
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
                              onItemClick={() => handleDeleteAuction(auction.auction_id)}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                            >
                              {deletingAuctionId === auction.auction_id ? "جاري الحذف..." : "حذف"}
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
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      currentPage === page
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
        fetchAllProducts
      />

      <Modal
        isOpen={isCreateStatusModalOpen}
        onClose={closeCreateStatusModal}
        className="max-w-[520px] p-5 lg:p-10"
      >
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          إضافة حالة مزاد
        </h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-status-name-key">
              مفتاح اسم الحالة <span className="text-red-500">*</span>
            </Label>
            <input
              id="new-status-name-key"
              type="text"
              value={newStatusNameKey}
              onChange={(e) => {
                setNewStatusNameKey(e.target.value);
                if (createStatusError) setCreateStatusError(null);
              }}
              placeholder="مثال: TEST_2"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30"
              disabled={createStatusSubmitting}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>
                الترجمات <span className="text-red-500">*</span>
              </Label>
              <Button
                size="sm"
                variant="outline"
                onClick={addNewStatusTranslation}
                disabled={createStatusSubmitting || newStatusTranslations.length >= LANGUAGE_OPTIONS.length}
              >
                إضافة لغة
              </Button>
            </div>
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
              {newStatusTranslations.map((tr, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <div className="min-w-[100px] flex-1">
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">اللغة</label>
                    <select
                      value={tr.language_code}
                      onChange={(e) => updateNewStatusTranslation(index, "language_code", e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                      disabled={createStatusSubmitting}
                    >
                      {LANGUAGE_OPTIONS.filter((o) => o.value === tr.language_code || !newStatusTranslations.some((t, i) => i !== index && t.language_code === o.value)).map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[140px] flex-1">
                    <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">اسم الحالة المترجم</label>
                    <input
                      type="text"
                      value={tr.translated_status_name}
                      onChange={(e) => updateNewStatusTranslation(index, "translated_status_name", e.target.value)}
                      placeholder="مثال: الاختبار الثاني"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30"
                      disabled={createStatusSubmitting}
                    />
                  </div>
                  {newStatusTranslations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNewStatusTranslation(index)}
                      className="rounded-lg border border-red-200 px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      disabled={createStatusSubmitting}
                    >
                      حذف
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {createStatusError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{createStatusError}</p>
        )}
        <div className="mt-6 flex gap-3 justify-end">
          <Button size="sm" variant="outline" onClick={closeCreateStatusModal} disabled={createStatusSubmitting}>
            إلغاء
          </Button>
          <Button
            size="sm"
            className="bg-purple-500 hover:bg-purple-600"
            onClick={handleCreateAuctionStatus}
            disabled={
              !newStatusNameKey.trim() ||
              !newStatusTranslations.some((t) => t.translated_status_name.trim()) ||
              createStatusSubmitting
            }
          >
            {createStatusSubmitting ? "جاري الحفظ..." : "إنشاء الحالة"}
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!editingStatus}
        onClose={closeEditStatusModal}
        className="max-w-[520px] p-5 lg:p-10"
      >
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          تعديل حالة المزاد
        </h4>
        {editingStatus && (
          <>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status-name-key">
                  مفتاح اسم الحالة <span className="text-red-500">*</span>
                </Label>
                <input
                  id="edit-status-name-key"
                  type="text"
                  value={editStatusNameKey}
                  onChange={(e) => {
                    setEditStatusNameKey(e.target.value);
                    if (updateStatusError) setUpdateStatusError(null);
                  }}
                  placeholder="مثال: TEST_2"
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30"
                  disabled={updateStatusSubmitting}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>
                    الترجمات <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addEditStatusTranslation}
                    disabled={updateStatusSubmitting || editStatusTranslations.length >= LANGUAGE_OPTIONS.length}
                  >
                    إضافة لغة
                  </Button>
                </div>
                <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/30">
                  {editStatusTranslations.map((tr, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-2">
                      <div className="min-w-[100px] flex-1">
                        <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">اللغة</label>
                        <select
                          value={tr.language_code}
                          onChange={(e) => updateEditStatusTranslation(index, "language_code", e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                          disabled={updateStatusSubmitting}
                        >
                          {LANGUAGE_OPTIONS.filter((o) => o.value === tr.language_code || !editStatusTranslations.some((t, i) => i !== index && t.language_code === o.value)).map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="min-w-[140px] flex-1">
                        <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">اسم الحالة المترجم</label>
                        <input
                          type="text"
                          value={tr.translated_status_name}
                          onChange={(e) => updateEditStatusTranslation(index, "translated_status_name", e.target.value)}
                          placeholder="مثال: الاختبار الثاني"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30"
                          disabled={updateStatusSubmitting}
                        />
                      </div>
                      {editStatusTranslations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditStatusTranslation(index)}
                          className="rounded-lg border border-red-200 px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                          disabled={updateStatusSubmitting}
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {updateStatusError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{updateStatusError}</p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <Button size="sm" variant="outline" onClick={closeEditStatusModal} disabled={updateStatusSubmitting}>
                إلغاء
              </Button>
              <Button
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                onClick={handleUpdateAuctionStatus}
                disabled={
                  !editStatusNameKey.trim() ||
                  !editStatusTranslations.some((t) => t.translated_status_name.trim()) ||
                  updateStatusSubmitting
                }
              >
                {updateStatusSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
