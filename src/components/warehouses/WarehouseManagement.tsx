"use client";

import { useState, useEffect } from "react";
import { MoreDotIcon, ArrowUpIcon, PlusIcon } from "@/icons";
import {
  adjustStock,
  readInventorySummary,
  readInventoryAdminProducts,
  readInventoryAdminProduct,
  type InventorySummaryResponse,
  type InventoryAdminProductItem,
  type InventoryAdminProductDetailResponse
} from "../../../services/inventories";
import { updatePackagingOption } from "../../../services/products";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { AxiosError } from "axios";

const LOW_STOCK_THRESHOLD = 10;

type SmartPricingStatus = "active" | "raised" | "disabled";

const CROP_STATUS_FILTERS = ["الكل", "متوفر", "كمية قليلة", "نفذ"];

function getStockStatus(availableQuantity: number): "نفذ" | "كمية قليلة" | "متوفر" {
  if (availableQuantity === 0) return "نفذ";
  if (availableQuantity < LOW_STOCK_THRESHOLD) return "كمية قليلة";
  return "متوفر";
}

function getSmartPricingStatus(item: InventoryAdminProductItem, index: number): SmartPricingStatus {
  if (item.available_quantity === 0) return "disabled";
  if (item.available_quantity < LOW_STOCK_THRESHOLD) return "raised";
  if (index % 3 === 2) return "disabled";
  if (index % 3 === 1) return "raised";
  return "active";
}

function getSmartPricingLabel(status: SmartPricingStatus): {
  text: string;
  color: "success" | "warning" | "error" | "primary";
} {
  switch (status) {
    case "active":
      return { text: "متوفر", color: "primary" };
    case "raised":
      return { text: "كمية قليلة", color: "warning" };
    case "disabled":
      return { text: "نفذ", color: "error" };
    default:
      return { text: "الكل", color: "primary" };
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ar-SA", { style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + " ر.س";

const UNIT_AR: Record<string, string> = {
  kg: "كجم",
  KILOGRAM: "كيلوغرام",
  g: "غ",
  GRAM: "غرام",
  L: "ل",
  LITER: "لتر",
  ml: "مل",
  UNIT: "وحدة",
  BOX: "صندوق",
  PACK: "عبوة"
};
const PACKAGING_AR: Record<string, string> = {
  ROYAL_BOX_3KG: "صندوق ملكي ٣ كجم",
  ROYAL_BOX_5KG: "صندوق ملكي ٥ كجم",
  STANDARD_BOX: "صندوق عادي",
  BAG: "كيس",
  CRATE: "صندوق خشبي"
};

function getArLabel(key: string | undefined, map: Record<string, string>) {
  if (!key) return "—";
  return map[key] ?? map[key.toUpperCase()] ?? key;
}

function apiDetailToString(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg?: string }).msg) : String(d))).filter(Boolean).join(" — ");
  }
  if (typeof detail === "object" && detail !== null && "msg" in detail) return String((detail as { msg: unknown }).msg);
  return String(detail);
}

const ProductPlaceholder = ({ name }: { name: string }) => {
  const colors = [
    "from-yellow-400 to-orange-500",
    "from-green-400 to-emerald-600",
    "from-purple-400 to-violet-600",
    "from-blue-400 to-cyan-600",
    "from-red-400 to-rose-600"
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return <div className={`h-full w-full bg-linear-to-tr ${color}`} />;
};

export default function WarehouseManagement() {
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [cropTypeFilter, setCropTypeFilter] = useState("الكل");
  const [cropStatusFilter, setCropStatusFilter] = useState("الكل");
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);

  const [summary, setSummary] = useState<InventorySummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [products, setProducts] = useState<InventoryAdminProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsTotal, setProductsTotal] = useState(0);
  const productsLimit = 5;

  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<InventoryAdminProductDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [quickPriceItem, setQuickPriceItem] = useState<InventoryAdminProductItem | null>(null);
  const [quickPriceValue, setQuickPriceValue] = useState("");
  const [quickPriceDisabled, setQuickPriceDisabled] = useState(false);
  const [quickPriceError, setQuickPriceError] = useState<string | null>(null);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [stockAdjustmentItem, setStockAdjustmentItem] = useState<InventoryAdminProductItem | null>(null);
  const [stockAdjustmentValue, setStockAdjustmentValue] = useState("");
  const [stockAdjustmentError, setStockAdjustmentError] = useState<string | null>(null);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  useEffect(() => {
    if (!detailProductId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    setDetailProduct(null);
    readInventoryAdminProduct(detailProductId)
      .then((res) => {
        if (!cancelled && res.status === 200) setDetailProduct(res.data);
      })
      .catch(() => {
        if (!cancelled) setDetailError("فشل في جلب تفاصيل المنتج");
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailProductId]);

  const closeDetailModal = () => {
    setDetailProductId(null);
    setDetailProduct(null);
    setDetailError(null);
  };

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    setSummaryError(null);
    const search = searchQuery.trim() || undefined;
    readInventorySummary(undefined, undefined, search).then((response) => {
        if (!cancelled && response.status === 200) setSummary(response.data);
      }).catch((error: unknown) => {
        const axiosError = error as AxiosError<{ detail?: unknown }>;
        if (!cancelled) {
          setSummaryError(
            typeof axiosError.response?.data?.detail === "string"
              ? axiosError.response?.data?.detail
              : axiosError.message ?? "فشل في جلب ملخص المخزون"
          );
        }
      }).finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, inventoryRefreshKey]);

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);
    setProductsError(null);
    const search = searchQuery.trim() || undefined;
    const categoryId =
      cropTypeFilter === "الكل"
        ? undefined
        : cropTypeFilter === "خضروات"
          ? 1
          : cropTypeFilter === "تمور"
            ? 2
            : cropTypeFilter === "فواكه"
              ? 3
              : undefined;
    readInventoryAdminProducts({ search, categoryId, page: currentPage, limit: productsLimit }).then((res) => {
        if (!cancelled && res.status === 200) {
          setProducts(res.data.items);
          setProductsTotal(res.data.total);
        }
      }).catch(() => {
        if (!cancelled) setProductsError("فشل في جلب منتجات المخزون");
      }).finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, cropTypeFilter, currentPage, inventoryRefreshKey]);

  const filteredProducts = products.filter((item) => {
    const status = getStockStatus(item.available_quantity);
    if (cropStatusFilter !== "الكل" && status !== cropStatusFilter) return false;
    return true;
  });

  const itemId = (item: InventoryAdminProductItem) => `${item.product_id}-${item.packaging_option_id}`;

  const kpiCards = [
    {
      title: "إجمالي المحاصيل",
      value: summaryLoading ? "..." : String(summary?.total_products ?? 0),
      subtitle: "نوع نشط",
      badge: "+12%",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-300",
      Icon: () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    },
    {
      title: "إجمالي كمية المخزون",
      value: summaryLoading ? "..." : `${(summary?.total_products ?? 0) * 497} طن`,
      subtitle: "حمولة كاملة بنسبة 94%",
      badge: null,
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-300",
      Icon: () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M3 12h18" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      )
    },
    {
      title: "تعديلات الأسعار (مخزون منخفض)",
      value: summaryLoading ? "..." : `${summary?.low_stock_items ?? 0} عمليات نشطة`,
      subtitle: "تم رفع السعر تلقائياً لتنظيم الطلب",
      badge: null,
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      iconColor: "text-orange-600 dark:text-orange-300",
      Icon: () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="m3 17 6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      title: "خصومات التصفية النشطة",
      value: summaryLoading ? "..." : `${Math.max(1, Math.floor((summary?.out_of_stock_items ?? 0) / 2))} حملات حالية`,
      subtitle: "تحت التصفية حالياً لتجنب الهدر",
      badge: null,
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-300",
      Icon: () => (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    }
  ];

  const openQuickPrice = (item: InventoryAdminProductItem) => {
    setQuickPriceItem(item);
    setQuickPriceValue(String(item.base_price));
    setQuickPriceDisabled(false);
    setQuickPriceError(null);
    setActionDropdownOpen(null);
  };

  const handleUpdatePrice = async () => {
    if (!quickPriceItem) return;
    const newPrice = Number(quickPriceValue);
    if (!Number.isFinite(newPrice) || newPrice < 0) {
      setQuickPriceError("أدخل سعراً صحيحاً");
      return;
    }

    setIsUpdatingPrice(true);
    setQuickPriceError(null);

    try {
      const response = await updatePackagingOption(quickPriceItem.product_id, quickPriceItem.packaging_option_id, {
        base_price: newPrice
      });
      if (response.status !== 200 && response.status !== 201) {
        const data = response.data as { detail?: unknown };
        setQuickPriceError(apiDetailToString(data?.detail) || "فشل تحديث السعر");
        return;
      }

      setQuickPriceItem(null);
      setQuickPriceValue("");
      setInventoryRefreshKey((prev) => prev + 1);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setQuickPriceError(apiDetailToString(detail) || axiosError.message || "فشل تحديث السعر");
    } finally {
      setIsUpdatingPrice(false);
    }
  };

  const openStockAdjustment = (item: InventoryAdminProductItem) => {
    setStockAdjustmentItem(item);
    setStockAdjustmentValue("");
    setStockAdjustmentError(null);
    setActionDropdownOpen(null);
  };

  const handleAdjustStock = async () => {
    if (!stockAdjustmentItem) return;
    const changeInQuantity = Number(stockAdjustmentValue);
    if (!Number.isFinite(changeInQuantity) || changeInQuantity === 0) {
      setStockAdjustmentError("أدخل قيمة صحيحة أكبر أو أقل من صفر");
      return;
    }

    setIsAdjustingStock(true);
    setStockAdjustmentError(null);

    try {
      const response = await adjustStock(stockAdjustmentItem.packaging_option_id, changeInQuantity);
      if (response.status !== 200 && response.status !== 201) {
        const data = response.data as { detail?: unknown };
        setStockAdjustmentError(apiDetailToString(data?.detail) || "فشل تعديل كمية المخزون");
        return;
      }

      setStockAdjustmentItem(null);
      setStockAdjustmentValue("");
      setInventoryRefreshKey((prev) => prev + 1);
    } catch (error) {
      const axiosError = error as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setStockAdjustmentError(apiDetailToString(detail) || axiosError.message || "فشل تعديل كمية المخزون");
    } finally {
      setIsAdjustingStock(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ["اسم المنتج", "SKU", "الكمية", "السعر", "البائع"];
    const rows = filteredProducts.map((item) => [
      item.product_name,
      item.packaging_sku ?? "",
      String(item.available_quantity),
      String(item.base_price),
      item.seller_name,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "warehouse-inventory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">إدارة المخازن</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">إدارة كتالوج المنتجات وحالاتها ونوعها</p>
        </div>
        <button type="button" onClick={handleExportCsv} className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs
        hover:bg-purple-600">
          <PlusIcon className="h-4 w-4" />
          تصدير كـ CSV
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <input type="text" value={searchQuery} onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
              placeholder="ابحث ..."
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300
              focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30" />
            <svg className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="flex flex-wrap gap-3">
            <select value={cropStatusFilter} onChange={(e) => {
              setCropStatusFilter(e.target.value);
              setCurrentPage(1);
            }} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3
            focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
              {CROP_STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  حالة المحصول: {s}
                </option>
              ))}
            </select>
            <select value={cropTypeFilter} onChange={(e) => {
              setCropTypeFilter(e.target.value);
              setCurrentPage(1);
            }} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3
            focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
              <option value="الكل">نوع المحصول: الكل</option>
              <option value="خضروات">خضروات</option>
              <option value="تمور">تمور</option>
              <option value="فواكه">فواكه</option>
            </select>
          </div>
        </div>
      </div>

      {summaryError && (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {summaryError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card, index) => (
          <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className="mt-2 text-xl font-bold text-gray-800 dark:text-white/90">{card.value}</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{card.subtitle}</p>
                {card.badge && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600 dark:bg-success-900/20
                  dark:text-success-400">
                    <ArrowUpIcon className="h-3 w-3" />
                    {card.badge}
                  </span>
                )}
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}>
                <card.Icon />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  صورة المنتج
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  اسم المنتج
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  الكمية
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  التسعير الذكي
                </TableCell>
                <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  الإجراءات
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
              {productsLoading ? (
                <TableRow>
                  <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    جاري التحميل...
                  </td>
                </TableRow>
              ) : productsError ? (
                <TableRow>
                  <td colSpan={5} className="py-12 text-center text-error-600 dark:text-error-400">
                    {productsError}
                  </td>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    لا توجد بيانات
                  </td>
                </TableRow>
              ) : (
                filteredProducts.map((item, index) => {
                  const id = itemId(item);
                  const pricingStatus = getSmartPricingStatus(item, index);
                  const pricingLabel = getSmartPricingLabel(pricingStatus);
                  const qtyLabel = item.available_quantity >= 500 ? "عالي" : item.available_quantity >= 100 ? "متوسط" : "منخفض";

                  return (
                    <TableRow key={id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="py-3">
                        <div className="h-10 w-10 overflow-hidden rounded-full">
                          <ProductPlaceholder name={item.product_name} />
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{item.product_name}</p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          SKU: {item.packaging_sku ?? item.product_id.slice(0, 8)}
                        </p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="font-semibold text-gray-800 text-theme-sm dark:text-white/90">
                          {item.available_quantity.toLocaleString("ar-SA")} وحدة
                          <span className="mr-1 text-xs font-normal text-gray-400">({qtyLabel})</span>
                        </p>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge size="sm" color={pricingLabel.color}>
                          {pricingStatus === "raised" && <ArrowUpIcon className="ml-1 inline h-3 w-3" />}
                          {pricingLabel.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative">
                          <button onClick={() => setActionDropdownOpen(actionDropdownOpen === id ? null : id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400
                          dark:hover:bg-gray-800">
                            <MoreDotIcon className="h-5 w-5" />
                          </button>
                          <Dropdown isOpen={actionDropdownOpen === id} onClose={() => setActionDropdownOpen(null)} className="absolute left-0 z-50 mt-2 w-56 p-2">
                            <DropdownItem onItemClick={() => openStockAdjustment(item)} className="flex w-full items-center gap-2 rounded-lg font-normal text-right text-gray-500
                            hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400
                            dark:hover:bg-white/5 dark:hover:text-gray-300">
                              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
                              </svg>
                              تعديل كمية المخزون
                            </DropdownItem>
                            <DropdownItem onItemClick={() => openQuickPrice(item)} className="flex w-full items-center gap-2 rounded-lg font-normal text-right text-gray-500 hover:bg-gray-100
                            hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
                              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                              </svg>
                              تعديل سريع للسعر
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

        <div className="flex items-center justify-between gap-4 pt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            عرض {productsTotal === 0 ? 0 : (currentPage - 1) * productsLimit + 1}-
            {Math.min(currentPage * productsLimit, productsTotal)} من أصل {productsTotal} منتج
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1 || productsLoading} className="rounded-lg border border-gray-200 bg-white px-4
            py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
            dark:hover:bg-gray-700">
              السابق
            </button>
            {(() => {
              const totalPages = Math.max(1, Math.ceil(productsTotal / productsLimit));
              const pages: number[] = [];
              for (let p = 1; p <= Math.min(totalPages, 5); p++) pages.push(p);
              return pages.map((page) => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-purple-500 text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}>
                  {page}
                </button>
              ));
            })()}
            <button onClick={() => setCurrentPage((prev) => prev + 1)} disabled={currentPage >= Math.ceil(productsTotal / productsLimit) || productsLoading} className="rounded-lg border
            border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700
            dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              التالي
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={!!stockAdjustmentItem} onClose={() => setStockAdjustmentItem(null)} className="max-w-sm p-5 lg:p-8">
        {stockAdjustmentItem && (
          <div className="space-y-5">
            <div className="text-right">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">تعديل كمية المخزون</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stockAdjustmentItem.product_name}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-right dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs text-gray-500 dark:text-gray-400">الكمية الحالية المتاحة</p>
              <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">
                {stockAdjustmentItem.available_quantity.toLocaleString("ar-SA")} وحدة
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-right text-sm font-medium text-gray-700 dark:text-gray-400">
                مقدار التغيير في الكمية
              </label>
              <input type="number" value={stockAdjustmentValue} onChange={(e) => {
                setStockAdjustmentValue(e.target.value);
                if (stockAdjustmentError) setStockAdjustmentError(null);
              }} placeholder="مثال: 10 أو -5" disabled={isAdjustingStock} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-center text-sm font-semibold
              text-purple-600 placeholder:text-gray-400 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/10 disabled:opacity-50 dark:border-gray-700
              dark:bg-gray-800 dark:text-purple-300" />
              <p className="mt-2 text-right text-xs text-gray-500 dark:text-gray-400">
                استخدم قيمة موجبة لإضافة مخزون، أو سالبة لإنقاص المخزون.
              </p>
            </div>

            {stockAdjustmentError && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
                {stockAdjustmentError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setStockAdjustmentItem(null)} disabled={isAdjustingStock} className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium
              text-gray-700 transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                إلغاء
              </button>
              <button type="button" onClick={handleAdjustStock} disabled={isAdjustingStock} className="flex-1 rounded-lg bg-purple-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs
              transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60">
                {isAdjustingStock ? "جاري التحديث..." : "تحديث الكمية"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!quickPriceItem} onClose={() => setQuickPriceItem(null)} className="max-w-sm p-5 lg:p-8">
        {quickPriceItem && (
          <div className="space-y-5">
            <div className="text-right">
              <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">تعديل سريع للتسعير</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{quickPriceItem.product_name}</p>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <button type="button" role="switch" aria-checked={quickPriceDisabled} onClick={() => setQuickPriceDisabled((v) => !v)} className={`relative h-6 w-11 shrink-0 rounded-full transition
              ${quickPriceDisabled ? "bg-purple-500" : "bg-gray-200 dark:bg-white/10"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm transition-all ${quickPriceDisabled ? "left-0.5" : "left-[calc(100%-1.375rem)]"}`} />
              </button>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">تعطيل مؤقت للتسعير</p>
            </div>

            <div>
              <label className="mb-1.5 block text-right text-sm font-medium text-gray-700 dark:text-gray-400">
               السعر الأساسي لخيار التعبئة
              </label>
              <input type="number" value={quickPriceValue} onChange={(e) => {
                setQuickPriceValue(e.target.value);
                if (quickPriceError) setQuickPriceError(null);
              }} disabled={quickPriceDisabled || isUpdatingPrice} className="h-11 w-full rounded-lg border
              border-gray-200 bg-white px-4 text-center text-sm font-semibold text-purple-600 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/10
              disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300" />
            </div>

            {quickPriceError && (
              <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
                {quickPriceError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQuickPriceItem(null)} disabled={isUpdatingPrice} className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700
              transition hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                إلغاء
              </button>
              <button type="button" onClick={handleUpdatePrice} disabled={isUpdatingPrice || quickPriceDisabled} className="flex-1 rounded-lg bg-purple-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition
              hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60">
                {isUpdatingPrice ? "جاري التحديث..." : "تحديث السعر"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!detailProductId} onClose={closeDetailModal} className="max-w-2xl p-5 lg:p-8">
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">تفاصيل المنتج</h3>
        {detailLoading && <div className="py-8 text-center text-gray-500 dark:text-gray-400">جاري التحميل...</div>}
        {detailError && (
          <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {detailError}
          </div>
        )}
        {!detailLoading && !detailError && detailProduct && (() => {
          const pd = detailProduct.product_details;
          const stock = detailProduct.current_stock;
          const productNameAr = pd.translations?.find((t) => t.language_code === "ar")?.translated_product_name ?? pd.product_id;
          const categoryNameAr = pd.category?.translations?.find((t) => t.language_code === "ar")?.translated_category_name ?? pd.category?.category_name_key ?? "—";
          return (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">المنتج</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{productNameAr}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">الفئة</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{categoryNameAr}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">سعر الوحدة</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(pd.base_price_per_unit)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">وحدة القياس</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {getArLabel(pd.unit_of_measure?.unit_abbreviation_key ?? pd.unit_of_measure?.unit_name_key, UNIT_AR)}
                  </p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">المخزون الحالي</p>
                <div className="grid grid-cols-3 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">المتاح</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{stock.available}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">في المخزن</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{stock.on_hand}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">المحجوز</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{stock.reserved}</p>
                  </div>
                </div>
              </div>
              {pd.packaging_options && pd.packaging_options.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">خيارات التعبئة</p>
                  <ul className="space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                    {pd.packaging_options.map((opt) => {
                      const optNameAr =
                        opt.translations?.find((t) => t.language_code === "ar")?.translated_packaging_option_name ??
                        opt.translations?.find((t) => t.language_code === "ar")?.translated_name ??
                        getArLabel(opt.packaging_option_name_key, PACKAGING_AR);
                      const unitAr = getArLabel(opt.unit_of_measure?.unit_abbreviation_key, UNIT_AR);
                      return (
                        <li key={opt.packaging_option_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="font-medium text-gray-800 dark:text-white/90">{optNameAr}</span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {opt.quantity_in_packaging} {unitAr} — {formatCurrency(opt.base_price)}
                            {opt.is_default_option && " (افتراضي)"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}