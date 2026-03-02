"use client";
import { useState, useEffect } from "react";
import { MoreDotIcon, ArrowUpIcon } from "@/icons";
import {
  readInventorySummary,
  readInventoryAdminProducts,
  readInventoryAdminProduct,
  type InventorySummaryResponse,
  type InventoryAdminProductItem,
  type InventoryAdminProductDetailResponse,
} from "../../../services/inventories";
import Badge from "../ui/badge/Badge";
import { Modal } from "../ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const LOW_STOCK_THRESHOLD = 10;

function getStockStatus(
  availableQuantity: number
): "نفذ" | "كمية قليلة" | "متوفر" {
  if (availableQuantity === 0) return "نفذ";
  if (availableQuantity < LOW_STOCK_THRESHOLD) return "كمية قليلة";
  return "متوفر";
}

function getStatusBadgeColor(
  status: "نفذ" | "كمية قليلة" | "متوفر"
): "success" | "warning" | "error" | "info" | "primary" {
  switch (status) {
    case "متوفر":
      return "success";
    case "كمية قليلة":
      return "warning";
    case "نفذ":
      return "error";
    default:
      return "primary";
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ar-SA", { style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + " ر.س";

// ترجمة الحالة ووحدة القياس للعربية (عند عدم وجود translations من API)
const STATUS_AR: Record<string, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  DRAFT: "مسودة",
  PENDING: "قيد المراجعة",
  SUSPENDED: "موقوف",
};
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
  PACK: "عبوة",
};
const PACKAGING_AR: Record<string, string> = {
  ROYAL_BOX_3KG: "صندوق ملكي ٣ كجم",
  ROYAL_BOX_5KG: "صندوق ملكي ٥ كجم",
  STANDARD_BOX: "صندوق عادي",
  BAG: "كيس",
  CRATE: "صندوق خشبي",
};

function getArLabel(key: string | undefined, map: Record<string, string>) {
  if (!key) return "—";
  return map[key] ?? map[key.toUpperCase()] ?? key;
}

export default function WarehouseManagement() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [cropTypeFilter, setCropTypeFilter] = useState("الكل");

  const [summary, setSummary] = useState<InventorySummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [products, setProducts] = useState<InventoryAdminProductItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsTotal, setProductsTotal] = useState(0);
  const productsLimit = 20;

  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [detailProduct, setDetailProduct] = useState<InventoryAdminProductDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

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
    readInventorySummary(undefined, undefined, search)
      .then((res) => {
        if (!cancelled && res.status === 200) setSummary(res.data);
      })
      .catch(() => {
        if (!cancelled) setSummaryError("فشل في جلب ملخص المخزون");
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

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
    readInventoryAdminProducts({
      search,
      categoryId,
      page: currentPage,
      limit: productsLimit,
    })
      .then((res) => {
        if (!cancelled && res.status === 200) {
          setProducts(res.data.items);
          setProductsTotal(res.data.total);
        }
      })
      .catch(() => {
        if (!cancelled) setProductsError("فشل في جلب منتجات المخزون");
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery, cropTypeFilter, currentPage]);

  const kpiCards = summary
    ? [
        { title: "نفذ من المخزون", value: String(summary.out_of_stock_items), change: null as string | null, isError: summary.out_of_stock_items > 0 },
        { title: "كمية قليلة", value: String(summary.low_stock_items), change: null as string | null, isError: false },
        { title: "اجمالي القيمة", value: formatCurrency(summary.total_value), change: null as string | null, isError: false },
        { title: "اجمالي المنتجات", value: String(summary.total_products), change: null as string | null, isError: false },
      ]
    : [
        { title: "نفذ من المخزون", value: "—", change: null as string | null, isError: false },
        { title: "كمية قليلة", value: "—", change: null as string | null, isError: false },
        { title: "اجمالي القيمة", value: "—", change: null as string | null, isError: false },
        { title: "اجمالي المنتجات", value: "—", change: null as string | null, isError: false },
      ];

  const itemId = (item: InventoryAdminProductItem) =>
    `${item.product_id}-${item.packaging_option_id}`;

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === products.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(products.map((item) => itemId(item)));
    }
  };

  const formatRestockDate = (dateString: string | null) => {
    if (!dateString) return "—";
    try {
      return new Intl.DateTimeFormat("ar-SA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

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
              value={cropTypeFilter}
              onChange={(e) => setCropTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">نوع المحصول: الكل</option>
              <option value="خضروات">خضروات</option>
              <option value="تمور">تمور</option>
              <option value="فواكه">فواكه</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary error */}
      {summaryError && (
        <div className="rounded-2xl border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {summaryError}
        </div>
      )}

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
                    summaryLoading
                      ? "animate-pulse text-gray-300 dark:text-gray-600"
                      : card.isError
                        ? "text-error-600 dark:text-error-500"
                        : "text-gray-800 dark:text-white/90"
                  }`}
                >
                  {summaryLoading ? "..." : card.value}
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

      {/* Sellers summary */}
      {summary && summary.sellers_summary?.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            ملخص البائعين
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summary.sellers_summary.map((s) => (
              <div
                key={s.seller_user_id}
                className="rounded-xl border border-gray-100 p-4 dark:border-gray-800"
              >
                <p className="truncate text-xs font-mono text-gray-500 dark:text-gray-400" title={s.seller_user_id}>
                  {s.seller_user_id}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  عدد المنتجات: <span className="font-medium">{s.total_items}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  القيمة: <span className="font-medium">{formatCurrency(s.total_value)}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
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
                        products.length > 0 &&
                        selectedItems.length === products.length
                      }
                      onChange={toggleSelectAll}
                      disabled={productsLoading}
                      className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    المنتج
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
                  المتاحة
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  المحجوزة
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  السعر
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
                  آخر إعادة تخزين
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  البائع
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
              {productsLoading ? (
                <TableRow>
                  <td colSpan={9} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    جاري التحميل...
                  </td>
                </TableRow>
              ) : productsError ? (
                <TableRow>
                  <td colSpan={9} className="py-12 text-center text-error-600 dark:text-error-400">
                    {productsError}
                  </td>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <td colSpan={9} className="py-12 text-center text-gray-500 dark:text-gray-400">
                    لا توجد بيانات
                  </td>
                </TableRow>
              ) : (
                products.map((item) => {
                  const id = itemId(item);
                  const status = getStockStatus(item.available_quantity);
                  return (
                    <TableRow
                      key={id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(id)}
                            onChange={() => toggleItemSelection(id)}
                            className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                          />
                          <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                            {item.product_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {item.on_hand_quantity}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {item.available_quantity}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {item.reserved_quantity}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {formatCurrency(item.base_price)}
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge size="sm" color={getStatusBadgeColor(status)}>
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {formatRestockDate(item.last_restock_date)}
                      </TableCell>
                      <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                        {item.seller_name}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionDropdownOpen(
                                actionDropdownOpen === id ? null : id
                              )
                            }
                            className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            <MoreDotIcon className="w-5 h-5" />
                          </button>
                          <Dropdown
                            isOpen={actionDropdownOpen === id}
                            onClose={() => setActionDropdownOpen(null)}
                            className="absolute left-0 mt-2 w-40 p-2 z-50"
                          >
                            <DropdownItem
                              onItemClick={() => {
                                setActionDropdownOpen(null);
                                setDetailProductId(item.product_id);
                              }}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              عرض التفاصيل
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
        <div className="flex items-center justify-between gap-4 pt-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            عرض{" "}
            {productsTotal === 0
              ? 0
              : (currentPage - 1) * productsLimit + 1}
            -
            {Math.min(currentPage * productsLimit, productsTotal)} من {productsTotal}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || productsLoading}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              السابق
            </button>
            {(() => {
              const totalPages = Math.max(1, Math.ceil(productsTotal / productsLimit));
              const pages: number[] = [];
              for (let p = 1; p <= Math.min(totalPages, 7); p++) pages.push(p);
              if (totalPages > 7 && currentPage > 4) {
                pages.length = 0;
                pages.push(1);
                for (let p = Math.max(2, currentPage - 1); p <= Math.min(currentPage + 1, totalPages - 1); p++) pages.push(p);
                if (totalPages > 2) pages.push(totalPages);
              } else if (totalPages > 7) pages.push(totalPages);
              return pages.map((page) => (
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
              ));
            })()}
            <button
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={
                currentPage >= Math.ceil(productsTotal / productsLimit) ||
                productsLoading
              }
              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              التالي
            </button>
          </div>
        </div>
      </div>

      {/* Product detail modal */}
      <Modal
        isOpen={!!detailProductId}
        onClose={closeDetailModal}
        className="max-w-2xl p-5 lg:p-8"
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          تفاصيل المنتج
        </h3>
        {detailLoading && (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            جاري التحميل...
          </div>
        )}
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">معرف المنتج</p>
                  <p className="truncate font-mono text-sm text-gray-800 dark:text-white/90" title={pd.product_id}>
                    {pd.product_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">الفئة</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{categoryNameAr}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">الحالة</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {getArLabel(pd.status?.status_name_key, STATUS_AR)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">سعر الوحدة</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">{formatCurrency(pd.base_price_per_unit)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">وحدة القياس</p>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {getArLabel(
                      pd.unit_of_measure?.unit_abbreviation_key ?? pd.unit_of_measure?.unit_name_key,
                      UNIT_AR
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">معرف البائع</p>
                  <p className="truncate font-mono text-sm text-gray-800 dark:text-white/90" title={pd.seller_user_id}>
                    {pd.seller_user_id}
                  </p>
                </div>
                {pd.sku && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">SKU</p>
                    <p className="font-medium text-gray-800 dark:text-white/90">{pd.sku}</p>
                  </div>
                )}
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
                        <li
                          key={opt.packaging_option_id}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
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

