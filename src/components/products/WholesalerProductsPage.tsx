/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { MoreDotIcon, DownloadIcon, ArrowUpIcon, PlusIcon } from "@/icons";
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
import Button from "../ui/button/Button";
import CreateProductForm from "./CreateProductForm";
import EditProductForm from "./EditProductForm";

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
  status: ApiStatus["status_name_key"];
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
    ? `${defaultPackaging.quantity_in_packaging} ${defaultPackaging.unit_of_measure?.unit_abbreviation_key ?? ""
      }`.trim()
    : `1 ${api.unit_of_measure?.unit_abbreviation_key ?? ""}`.trim();

  // Map backend status_name_key to Arabic UI status for wholesaler
  let status: Product["status"];
  switch (api.status?.status_name_key) {
    case "ACTIVE":
      status = "منشور";
      break;
    case "INACTIVE":
      status = "مرفوض";
      break;
    case "DISCONTINUED":
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
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiProducts, setApiProducts] = useState<ApiProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ApiProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  const itemsPerPage = 6;

  const handleDeleteProduct = useCallback(async (productId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
    setDeletingProductId(productId);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `https://api-testing.mothmerah.sa/api/v1/products/${productId}`,
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
        const msg =
          (typeof errData?.message === "string" ? errData.message : null) ||
          (typeof errData?.detail === "string" ? errData.detail : null) ||
          "فشل في حذف المنتج";
        throw new Error(msg);
      }
      // DELETE is a soft delete (status change); refresh list so UI shows updated status or product is excluded
      await fetchProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ في حذف المنتج"
      );
    } finally {
      setDeletingProductId(null);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/products/me", {
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
      const list = data || [];
      setApiProducts(list);
      setProducts(list.map(mapApiProductToProduct));
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

  const totalItems = products.length;
  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
      ...products.map((product) => [
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
        <div className="mb-4 flex items-center justify-between">
          <Button
            size="sm"
            className="bg-purple-500 hover:bg-purple-600"
            onClick={() => setIsCreateProductModalOpen(true)}
          >
            <PlusIcon className="w-4 h-4 ml-2" />
            إنشاء منتج جديد
          </Button>
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
        ) : products.length === 0 ? (
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
                        <div className="h-10 w-10 overflow-hidden rounded-lg bg-gray-100">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                if (target.parentElement) {
                                  target.parentElement.className += " bg-linear-to-tr from-yellow-400 to-orange-500";
                                }
                              }}
                              unoptimized
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
                              const apiProduct = apiProducts.find((p) => p.product_id === product.id);
                              if (apiProduct) {
                                setEditingProduct(apiProduct);
                                setIsEditProductModalOpen(true);
                              }
                            }}
                            className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            تعديل
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => {
                              setActionDropdownOpen(null);
                              handleDeleteProduct(product.id);
                            }}
                            className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                          >
                            {deletingProductId === product.id ? "جاري الحذف..." : "حذف"}
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
        {!isLoading && products.length > 0 && (
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
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${currentPage === page
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

      <CreateProductForm
        isOpen={isCreateProductModalOpen}
        onClose={() => setIsCreateProductModalOpen(false)}
        onSuccess={async (createdProduct) => {
          await fetchProducts();
          if (createdProduct) {
            const mapped = mapApiProductToProduct(createdProduct as ApiProduct);
            setProducts((prev) => {
              if (prev.some((p) => p.id === mapped.id)) return prev;
              return [mapped, ...prev];
            });
          }
        }}
      />

      <EditProductForm
        key={editingProduct?.product_id ?? "edit-form"}
        isOpen={isEditProductModalOpen}
        onClose={() => {
          setIsEditProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSuccess={() => {
          fetchProducts();
        }}
        product={editingProduct}
      />
    </div>
  );
}

