"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  imageUrl: string;
  category: string;
  owner: string;
  availableQuantity: string;
  saleType: "ثابت" | "مزاد" | "RFQ";
  status: "مسودة" | "منشور" | "مرفوض" | "بانتظار الموافقة" | "مؤرشف" | "موقوف مؤقتا";
  addedDate: string;
}

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

  // Map backend status_name_key to Arabic UI status for wholesaler
  let status: Product["status"];
  switch (api.status?.status_name_key) {
    case "PUBLISHED":
      status = "منشور";
      break;
    case "REJECTED":
      status = "مرفوض";
      break;
    case "PENDING_APPROVAL":
      status = "بانتظار الموافقة";
      break;
    case "ARCHIVED":
      status = "مؤرشف";
      break;
    case "SUSPENDED":
      status = "موقوف مؤقتا";
      break;
    case "DRAFT":
    default:
      status = "مسودة";
      break;
  }

  // Determine sale type based on product tags or other criteria
  // For now, defaulting to "ثابت" as we don't have this info in the API
  const saleType: "ثابت" | "مزاد" | "RFQ" = "ثابت";

  return {
    id: api.product_id, // This is the product_id from API
    name:
      arTranslation?.translated_product_name ??
      api.category?.category_name_key ??
      "منتج",
    imageUrl: api.main_image_url ?? "",
    category:
      arCategory?.translated_category_name ?? api.category?.category_name_key ?? "غير محدد",
    owner: "مزارع", // Default owner, can be enhanced based on seller_user_id if needed
    availableQuantity,
    saleType,
    status,
    addedDate: formatAddedDate(api.created_at),
  };
};


export default function WholesalerProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [relatedToFilter, setRelatedToFilter] = useState("الكل");
  const [ownerFilter, setOwnerFilter] = useState("الكل");
  const [categoryFilter, setCategoryFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [startDateFilter, setStartDateFilter] = useState("18/02/2025");
  const [endDateFilter, setEndDateFilter] = useState("12/02/2025");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const itemsPerPage = 6;

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      const response = await fetch("http://127.0.0.1:8000/api/v1/me", {
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

  // Filter products based on search and filters
  let filteredProducts = products;
  
  if (searchQuery) {
    filteredProducts = filteredProducts.filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (statusFilter !== "الكل") {
    filteredProducts = filteredProducts.filter((product) => product.status === statusFilter);
  }

  if (categoryFilter !== "الكل") {
    filteredProducts = filteredProducts.filter((product) => product.category === categoryFilter);
  }

  if (ownerFilter !== "الكل") {
    filteredProducts = filteredProducts.filter((product) => product.owner === ownerFilter);
  }

  const totalItems = filteredProducts.length;
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

  const getStatusBadgeColor = (
    status: Product["status"]
  ): "success" | "warning" | "error" | "info" | "primary" => {
    switch (status) {
      case "منشور":
        return "success";
      case "بانتظار الموافقة":
        return "warning";
      case "مرفوض":
        return "error";
      case "مسودة":
        return "primary";
      case "مؤرشف":
        return "info";
      case "موقوف مؤقتا":
        return "warning";
      default:
        return "primary";
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ["اسم المنتج", "الفئة", "المالك", "الكمية المتاحة", "نوع البيع", "الحالة", "تاريخ الاضافة"],
      ...filteredProducts.map((product) => [
        product.name,
        product.category,
        product.owner,
        product.availableQuantity,
        product.saleType,
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
    link.setAttribute("download", `products_catalog_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics from real data
  const totalProductsCount = products.length;
  const pendingApprovalCount = products.filter((p) => p.status === "بانتظار الموافقة").length;
  const linkedToAuctionsCount = products.filter((p) => p.saleType === "مزاد").length;
  const linkedToRFQCount = products.filter((p) => p.saleType === "RFQ").length;
  const inactiveCount = products.filter((p) => p.status === "مؤرشف" || p.status === "موقوف مؤقتا").length;
  const rejectedCount = products.filter((p) => p.status === "مرفوض").length;

  const statisticsCards = [
    {
      title: "اجمالي المنتجات",
      value: totalProductsCount.toLocaleString("ar-SA"),
      change: "+5.3%",
    },
    {
      title: "منتجات بإنتظار الموافقة",
      value: pendingApprovalCount.toLocaleString("ar-SA"),
      change: "+1.3%",
    },
    {
      title: "منتجات مرتبطة بمزادات",
      value: linkedToAuctionsCount.toLocaleString("ar-SA"),
      change: "+1.3%",
    },
    {
      title: "منتجات مرتبطة ب RFQ",
      value: linkedToRFQCount.toLocaleString("ar-SA"),
      change: "+1.3%",
    },
    {
      title: "منتجات غير نشطة",
      value: inactiveCount.toLocaleString("ar-SA"),
      change: "+1.3%",
    },
    {
      title: "منتجات مرفوضة",
      value: rejectedCount.toLocaleString("ar-SA"),
      change: "+1.3%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          ادارة كتالوج المنتجات
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          ادارة كتالوج المنتجات وحالاتها ونوعها
        </p>
      </div>

      {/* Filters and Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
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
              value={relatedToFilter}
              onChange={(e) => setRelatedToFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">مرتبط ب: الكل</option>
              <option value="مزادات">مزادات</option>
              <option value="RFQ">RFQ</option>
            </select>

            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">المالك: الكل</option>
              <option value="مزارع">مزارع</option>
              <option value="تاجر">تاجر</option>
              <option value="رخصة حرة">رخصة حرة</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">الفئة: الكل</option>
              <option value="خضروات">خضروات</option>
              <option value="تمور">تمور</option>
              <option value="فواكه">فواكه</option>
              <option value="غذائي">غذائي</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            >
              <option value="الكل">الحالة: الكل</option>
              <option value="مسودة">مسودة</option>
              <option value="منشور">منشور</option>
              <option value="مرفوض">مرفوض</option>
              <option value="بانتظار الموافقة">بانتظار الموافقة</option>
              <option value="مؤرشف">مؤرشف</option>
              <option value="موقوف مؤقتا">موقوف مؤقتا</option>
            </select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                تاريخ اضافة المنتج:
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={startDateFilter}
                  onChange={(e) => setStartDateFilter(e.target.value)}
                  placeholder="18/02/2025"
                  className="w-32 rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <CalenderIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  placeholder="12/02/2025"
                  className="w-32 rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <CalenderIcon className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
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
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={handleExportCSV}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <DownloadIcon className="w-4 h-4 inline-block ml-2" />
            تصدير ك CSV
          </button>
        </div>

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
                          paginatedProducts.length > 0 &&
                          selectedProducts.length === paginatedProducts.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
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
                <TableRow
                  key={product.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              if (target.parentElement) {
                                target.parentElement.className += " bg-linear-to-tr from-yellow-400 to-orange-500";
                              }
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-linear-to-tr from-yellow-400 to-orange-500" />
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {product.name}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {product.category}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {product.owner}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {product.availableQuantity}
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {product.saleType}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getStatusBadgeColor(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                    {product.addedDate}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setActionDropdownOpen(
                            actionDropdownOpen === product.id ? null : product.id
                          )
                        }
                        className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      >
                        <MoreDotIcon className="w-5 h-5" />
                      </button>
                      <Dropdown
                        isOpen={actionDropdownOpen === product.id}
                        onClose={() => setActionDropdownOpen(null)}
                        className="absolute left-0 mt-2 w-40 p-2 z-50"
                      >
                        <DropdownItem
                          onItemClick={() => {
                            setActionDropdownOpen(null);
                            router.push(`${pathname}/${product.id}`);
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
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                السابق
              </button>
              {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }, (_, i) => i + 1)
                .slice(0, 5)
                .map((page) => (
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
                onClick={() => setCurrentPage((prev) => Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
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

