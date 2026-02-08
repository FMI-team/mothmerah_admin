"use client";

import { useState, useEffect, useCallback } from "react";
import { DownloadIcon } from "@/icons";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import { getAuthHeader } from "../../../services/auth";

const API_BASE = "https://api-testing.mothmerah.sa";

interface InventoryStatus {
  status_name_key: string;
}

interface ApiInventoryItem {
  inventory_item_id: number;
  product_packaging_option_id: number;
  seller_user_id: string;
  on_hand_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  inventory_item_status_id: number;
  status: InventoryStatus;
  last_restock_date: string | null;
  location_identifier: string | null;
  created_at: string;
  updated_at: string;
  transactions: unknown[];
}

const STATUS_LABELS: Record<string, string> = {
  IN_STOCK: "متوفر",
  OUT_OF_STOCK: "نفذ",
  RESERVED: "محجوز",
  LOW_STOCK: "كمية قليلة",
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

const getStatusBadgeColor = (key: string): "success" | "warning" | "error" | "info" | "primary" => {
  const k = key.toUpperCase();
  if (k === "IN_STOCK") return "success";
  if (k === "OUT_OF_STOCK" || k === "LOW_STOCK") return "warning";
  if (k === "RESERVED") return "info";
  return "primary";
};

export default function WholesalerInventoryPage() {
  const [items, setItems] = useState<ApiInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [adjustStockItem, setAdjustStockItem] = useState<ApiInventoryItem | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<string>("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const itemsPerPage = 10;

  const fetchInventory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/inventory/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      if (!response.ok) {
        throw new Error("فشل في جلب المخزون");
      }
      const data: ApiInventoryItem[] = await response.json();
      setItems(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ في جلب بيانات المخزون"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const openAdjustModal = (item: ApiInventoryItem) => {
    setAdjustStockItem(item);
    setAdjustQuantity("");
    setAdjustError(null);
  };

  const closeAdjustModal = () => {
    setAdjustStockItem(null);
    setAdjustQuantity("");
    setAdjustError(null);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    if (!adjustStockItem) return;
    e.preventDefault();
    const change = parseInt(adjustQuantity, 10);
    if (Number.isNaN(change) || change === 0) {
      setAdjustError("أدخل قيمة صحيحة (موجبة للإضافة أو سالبة للخصم)");
      return;
    }
    setIsAdjusting(true);
    setAdjustError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(`${API_BASE}/api/v1/inventory/adjust-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          product_packaging_option_id: adjustStockItem.product_packaging_option_id,
          change_in_quantity: change,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { detail?: string })?.detail || "فشل في تعديل الكمية"
        );
      }
      closeAdjustModal();
      await fetchInventory();
    } catch (err) {
      setAdjustError(
        err instanceof Error ? err.message : "حدث خطأ في تعديل الكمية"
      );
    } finally {
      setIsAdjusting(false);
    }
  };

  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const handleExportCSV = () => {
    const csvContent = [
      [
        "معرف الصنف",
        "معرف خيار التغليف",
        "الكمية الفعلية",
        "الكمية المحجوزة",
        "الكمية المتاحة",
        "الحالة",
        "آخر إعادة تخزين",
        "موقع التخزين",
        "تاريخ الإنشاء",
      ],
      ...items.map((item) => [
        item.inventory_item_id,
        item.product_packaging_option_id,
        item.on_hand_quantity,
        item.reserved_quantity,
        item.available_quantity,
        STATUS_LABELS[item.status?.status_name_key || ""] || item.status?.status_name_key || "",
        item.last_restock_date ? formatDate(item.last_restock_date) : "",
        item.location_identifier || "",
        formatDate(item.created_at),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_${new Date().getTime()}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          ادارة المخزون
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          عرض وإدارة أصناف المخزون والكميات المتاحة
        </p>
      </div>

      {error && (
        <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <DownloadIcon className="w-4 h-4" />
            تصدير ك CSV
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">جاري التحميل...</div>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">لا توجد أصناف في المخزون</div>
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      معرف الصنف
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      خيار التغليف
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      الكمية الفعلية
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      الكمية المحجوزة
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      الكمية المتاحة
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      الحالة
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      آخر إعادة تخزين
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      موقع التخزين
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      تاريخ الإنشاء
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      إجراءات
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedItems.map((item) => {
                    const statusKey = item.status?.status_name_key || "";
                    const statusLabel = STATUS_LABELS[statusKey] || statusKey;
                    return (
                      <TableRow
                        key={item.inventory_item_id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <TableCell className="py-3 font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {item.inventory_item_id}
                        </TableCell>
                        <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                          {item.product_packaging_option_id}
                        </TableCell>
                        <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                          {item.on_hand_quantity}
                        </TableCell>
                        <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                          {item.reserved_quantity}
                        </TableCell>
                        <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                          {item.available_quantity}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge size="sm" color={getStatusBadgeColor(statusKey)}>
                            {statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {item.last_restock_date
                            ? formatDate(item.last_restock_date)
                            : "—"}
                        </TableCell>
                        <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                          {item.location_identifier || "—"}
                        </TableCell>
                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                          {formatDate(item.created_at)}
                        </TableCell>
                        <TableCell className="py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAdjustModal(item)}
                          >
                            تعديل الكمية
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    السابق
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(
                    (page) => (
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
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={!!adjustStockItem}
        onClose={closeAdjustModal}
        className="max-w-[420px] p-5 lg:p-6"
      >
        <form onSubmit={handleAdjustStock}>
          <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
            تعديل الكمية
          </h4>
          {adjustStockItem && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              خيار التغليف: {adjustStockItem.product_packaging_option_id} —
              الكمية الحالية: {adjustStockItem.on_hand_quantity}
            </p>
          )}
          <div className="mb-4">
            <Label>التغيير في الكمية</Label>
            <input
              type="number"
              value={adjustQuantity}
              onChange={(e) => setAdjustQuantity(e.target.value)}
              placeholder="مثال: 5 للإضافة، -3 للخصم"
              step={1}
              autoFocus
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder-white/30 dark:focus:border-brand-800"
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              استخدم قيمة موجبة للإضافة وسالبة للخصم
            </p>
          </div>
          {adjustError && (
            <div className="mb-4 p-3 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
              {adjustError}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeAdjustModal}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3 dark:hover:text-gray-300"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isAdjusting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-brand-300"
            >
              {isAdjusting ? "جاري التعديل..." : "تطبيق التعديل"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
