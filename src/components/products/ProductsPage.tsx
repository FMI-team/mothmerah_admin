"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DownloadIcon, MoreDotIcon } from "@/icons";
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
import { getAuthHeader } from "@/lib/auth";

// ------------- API Types -------------

interface ApiTranslation {
  language_code: string;
  translated_product_name?: string;
  translated_description?: string | null;
  translated_short_description?: string | null;
}

interface ApiCategoryTranslation {
  language_code: string;
  translated_category_name: string;
  translated_category_description: string | null;
}

interface ApiCategory {
  category_name_key: string;
  parent_category_id: number;
  category_image_url: string | null;
  sort_order: number | null;
  is_active: boolean;
  category_id: number;
  translations: ApiCategoryTranslation[];
}

interface ApiStatus {
  status_name_key: string;
  product_status_id: number;
}

interface ApiUnitOfMeasure {
  unit_id: number;
  unit_name_key: string;
  unit_abbreviation_key: string;
  is_active: boolean;
}

interface ApiPackagingOption {
  packaging_option_name_key: string;
  custom_packaging_description: string | null;
  quantity_in_packaging: number;
  unit_of_measure_id_for_quantity: number;
  base_price: number;
  sku: string | null;
  barcode: string | null;
  is_default_option: boolean;
  is_active: boolean;
  sort_order: number;
  packaging_option_id: number;
  product_id: string;
  unit_of_measure: ApiUnitOfMeasure;
  translations: ApiTranslation[];
}

interface ApiProduct {
  category_id: number;
  base_price_per_unit: number;
  unit_of_measure_id: number;
  country_of_origin_code: string;
  is_organic: boolean;
  is_local_saudi_product: boolean;
  main_image_url: string | null;
  sku: string | null;
  tags: unknown[];
  product_id: string;
  seller_user_id: string;
  created_at: string;
  updated_at: string;
  category: ApiCategory;
  status: ApiStatus;
  unit_of_measure: ApiUnitOfMeasure;
  translations: ApiTranslation[];
  packaging_options: ApiPackagingOption[];
}

// ------------- UI Product Type -------------

interface Product {
  id: string;
  name: string;
  ownerName: string;
  category: string;
  saleType: "ثابت" | "مزاد" | "RFQ";
  availableQuantity: string;
  status:
    | "مسودة" // DRAFT
    | "نشط" // ACTIVE
    | "غير نشط" // INACTIVE
    | "موقوفة"; // DISCONTINUED
  addedDate: string;
  imageUrl: string;
}

type StatusFilter =
  | "الكل"
  | "مسودة"
  | "نشط"
  | "غير نشط"
  | "موقوفة";

const statusFilters: StatusFilter[] = [
  "الكل",
  "مسودة",
  "نشط",
  "غير نشط",
  "موقوفة",
];

const getStatusBadgeColor = (
  status: Product["status"]
): "success" | "warning" | "error" | "info" | "primary" => {
  switch (status) {
    case "مسودة":
      return "primary";
    case "نشط":
      return "success";
    case "غير نشط":
      return "warning";
    case "موقوفة":
      return "error";
    default:
      return "warning";
  }
};

const formatAddedDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

const mapApiProductToProduct = (api: ApiProduct): Product => {
  const arTranslation = api.translations?.find(
    (t) => t.language_code === "ar"
  );
  const arCategory = api.category?.translations?.find(
    (t) => t.language_code === "ar"
  );
  const defaultPackaging =
    api.packaging_options?.find((p) => p.is_default_option) ??
    api.packaging_options?.[0];

  const availableQuantity = defaultPackaging
    ? `${defaultPackaging.quantity_in_packaging} ${
        defaultPackaging.unit_of_measure?.unit_abbreviation_key ?? ""
      }`.trim()
    : `1 ${api.unit_of_measure?.unit_abbreviation_key ?? ""}`.trim();

  // Map backend status_name_key to Arabic UI status
  let status: Product["status"];
  switch (api.status?.status_name_key) {
    case "ACTIVE":
      status = "نشط";
      break;
    case "INACTIVE":
      status = "غير نشط";
      break;
    case "DISCONTINUED":
      status = "موقوفة";
      break;
    case "DRAFT":
    default:
      status = "مسودة";
      break;
  }

  return {
    id: api.product_id,
    name:
      arTranslation?.translated_product_name ??
      api.category?.category_name_key ??
      "منتج",
    ownerName: "بائع",
    category:
      arCategory?.translated_category_name ?? api.category?.category_name_key,
    saleType: "ثابت",
    availableQuantity,
    status,
    addedDate: formatAddedDate(api.created_at),
    imageUrl: api.main_image_url ?? "",
  };
};

export default function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("الكل");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage = 6;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      if (!response.ok) {
        throw new Error("فشل في جلب المنتجات");
      }

      const data: ApiProduct[] = await response.json();
      const mapped = (data || []).map(mapApiProductToProduct);
      setProducts(mapped);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ في جلب بيانات المنتجات"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts =
    selectedStatus === "الكل"
      ? products
      : products.filter((product) => product.status === selectedStatus);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map((product) => product.id));
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      [
        "اسم المنتج",
        "الفئة",
        "المالك",
        "نوع البيع",
        "الكمية المتاحة",
        "الحالة",
        "تاريخ الاضافة",
      ],
      ...filteredProducts.map((product) => [
        product.name,
        product.category,
        product.ownerName,
        product.saleType,
        product.availableQuantity,
        product.status,
        product.addedDate,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `products_catalog_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalItems = filteredProducts.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Summary metrics based on API data
  const totalProducts = products.length;
  const draftCount = products.filter((p) => p.status === "مسودة").length;
  const activeCount = products.filter((p) => p.status === "نشط").length;
  const inactiveCount = products.filter((p) => p.status === "غير نشط").length;
  const discontinuedCount = products.filter((p) => p.status === "موقوفة").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            ادارة كتالوج المنتجات
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            ادارة كتالوج المنتجات وتفاصيلها وانواعها
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-purple-600"
          >
            <DownloadIcon className="w-4 h-4" />
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                اجمالي المنتجات
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {totalProducts.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +5.3%
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                منتجات مسودة
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {draftCount.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +1.3%
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                منتجات نشطة
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {activeCount.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +5.3%
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                منتجات موقوفة
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {discontinuedCount.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +1.3%
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                منتجات غير نشطة
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {inactiveCount.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +1.3%
            </div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              تاريخ اضافة المنتج
            </span>
            <input
              type="text"
              placeholder="12/02/2025"
              className="h-10 w-28 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
            <input
              type="text"
              placeholder="18/02/2025"
              className="h-10 w-28 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        {error && (
          <div className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">
            جاري تحميل المنتجات...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            لا توجد منتجات متاحة حاليا
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        paginatedProducts.length > 0 &&
                        selectedProducts.length === paginatedProducts.length
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    صورة المنتج
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  اسم المنتج
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
                  المالك
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  الكمية المتاحة
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  نوع البيع
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
                  تاريخ الاضافة
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
              {paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                        {/* Placeholder product image */}
                        <div className="h-full w-full bg-linear-to-tr from-yellow-400 to-orange-500" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {product.name}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {product.category}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {product.ownerName}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {product.availableQuantity}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {product.saleType}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getStatusBadgeColor(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {product.addedDate}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActionDropdownOpen(
                              actionDropdownOpen === product.id
                                ? null
                                : product.id
                            )
                          }
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          <MoreDotIcon className="h-5 w-5" />
                        </button>
                        <Dropdown
                          isOpen={actionDropdownOpen === product.id}
                          onClose={() => setActionDropdownOpen(null)}
                          className="absolute left-0 z-50 mt-2 w-40 p-2"
                        >
                          <DropdownItem
                            onItemClick={() => {
                              setActionDropdownOpen(null);
                              router.push(`${pathname}/${product.id}`);
                            }}
                            className="flex w-full rounded-lg font-normal text-right text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            عرض التفاصيل
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => {
                              setActionDropdownOpen(null);
                            }}
                            className="flex w-full rounded-lg font-normal text-right text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            تعديل
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => {
                              setActionDropdownOpen(null);
                            }}
                            className="flex w-full rounded-lg font-normal text-right text-gray-500 hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                          >
                            ايقاف / حذف
                          </DropdownItem>
                        </Dropdown>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        )}

        {/* Pagination */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between gap-4 pt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              عرض {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
              {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-10 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                السابق
              </button>
              {[1, 2].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-purple-500 text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage >= totalPages}
                className="h-10 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


