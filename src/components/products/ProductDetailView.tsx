"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAuthHeader } from "@/lib/auth";
import Image from "next/image";
import Badge from "../ui/badge/Badge";
import Label from "../form/Label";
import { UserCircleIcon } from "@/icons";

interface ProductTranslation {
  language_code: string;
  translated_product_name?: string;
  translated_description?: string | null;
  translated_short_description?: string | null;
}

interface CategoryTranslation {
  language_code: string;
  translated_category_name?: string;
  translated_category_description?: string | null;
}

interface Category {
  category_name_key: string;
  parent_category_id: number;
  category_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  category_id: number;
  translations: CategoryTranslation[];
}

interface ProductStatus {
  status_name_key: string;
  product_status_id: number;
}

interface UnitOfMeasure {
  unit_id: number;
  unit_name_key: string;
  unit_abbreviation_key: string;
  is_active: boolean;
}

interface PackagingOption {
  // Add packaging option fields if needed
  [key: string]: unknown;
}

interface ProductDetails {
  category_id: number;
  base_price_per_unit: number;
  unit_of_measure_id: number;
  country_of_origin_code: string;
  is_organic: boolean;
  is_local_saudi_product: boolean;
  main_image_url: string | null;
  sku: string;
  tags: string[];
  product_id: string;
  seller_user_id: string;
  created_at: string;
  updated_at: string;
  category: Category;
  status: ProductStatus;
  unit_of_measure: UnitOfMeasure;
  translations: ProductTranslation[];
  packaging_options: PackagingOption[];
}

const getArabicTranslation = (
  translations: ProductTranslation[] | CategoryTranslation[],
  field: "translated_product_name" | "translated_description" | "translated_short_description" | "translated_category_name" | "translated_category_description"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field as keyof typeof arabicTranslation] as string || "";
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

const getStatusBadgeColor = (statusName: string): "success" | "warning" | "error" | "info" => {
  const status = statusName.toLowerCase();
  if (status === "نشط" || status === "active") {
    return "success";
  }
  if (status === "قيد الانتظار" || status.includes("pending")) {
    return "warning";
  }
  if (status === "معلق" || status.includes("suspended")) {
    return "error";
  }
  return "info";
};

export default function ProductDetailView() {
  const params = useParams();
  const productId = params?.productId as string;
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) {
        setError("معرف المنتج غير متوفر");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const authHeader = getAuthHeader();
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/products/${productId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeader,
            },
          }
        );

        if (!response.ok) {
          throw new Error("فشل في جلب تفاصيل المنتج");
        }

        const data: ProductDetails = await response.json();
        setProductDetails(data);
      } catch (err) {
        console.error("Error fetching product details:", err);
        setError(
          err instanceof Error ? err.message : "حدث خطأ في جلب تفاصيل المنتج"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          جاري تحميل تفاصيل المنتج...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
        {error}
      </div>
    );
  }

  if (!productDetails) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        لا توجد معلومات متاحة
      </div>
    );
  }

  const productName = getArabicTranslation(
    productDetails.translations,
    "translated_product_name"
  ) || productDetails.product_id;

  const productDescription = getArabicTranslation(
    productDetails.translations,
    "translated_description"
  ) || "";

  const categoryName = getArabicTranslation(
    productDetails.category.translations,
    "translated_category_name"
  ) || productDetails.category.category_name_key;

  return (
    <div className="space-y-6">
      {/* Product Header Card */}
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Product Image */}
          <div className="shrink-0">
            <div className="w-full max-w-xs overflow-hidden border border-gray-200 rounded-2xl dark:border-gray-800">
              {productDetails.main_image_url ? (
                <Image
                  width={400}
                  height={400}
                  src={productDetails.main_image_url}
                  alt={productName}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center w-full h-64 bg-gray-100 dark:bg-gray-800">
                  <UserCircleIcon className="w-32 h-32 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                  {productName}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <Badge
                    size="sm"
                    color={getStatusBadgeColor(productDetails.status.status_name_key)}
                  >
                    {productDetails.status.status_name_key}
                  </Badge>
                  {productDetails.is_organic && (
                    <Badge size="sm" color="success">
                      عضوي
                    </Badge>
                  )}
                  {productDetails.is_local_saudi_product && (
                    <Badge size="sm" color="info">
                      منتج سعودي محلي
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {productDescription && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {productDescription}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Basic Information */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            المعلومات الأساسية
          </h4>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                معرف المنتج
              </Label>
              <p className="mt-1 text-xs font-mono font-medium text-gray-800 dark:text-white/90 break-all">
                {productDetails.product_id}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                رمز المنتج (SKU)
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {productDetails.sku || "غير متوفر"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                الفئة
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {categoryName}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                السعر الأساسي لكل وحدة
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {productDetails.base_price_per_unit.toFixed(2)} ريال
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                وحدة القياس
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {productDetails.unit_of_measure.unit_name_key} ({productDetails.unit_of_measure.unit_abbreviation_key})
              </p>
            </div>
          </div>
        </div>

        {/* Product Properties */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            خصائص المنتج
          </h4>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                بلد المنشأ
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {productDetails.country_of_origin_code || "غير محدد"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                منتج عضوي
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {productDetails.is_organic ? "نعم" : "لا"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                منتج سعودي محلي
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {productDetails.is_local_saudi_product ? "نعم" : "لا"}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                معرف البائع
              </Label>
              <p className="mt-1 text-xs font-mono font-medium text-gray-800 dark:text-white/90 break-all">
                {productDetails.seller_user_id}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                حالة المنتج
              </Label>
              <div className="mt-1">
                <Badge
                  size="sm"
                  color={getStatusBadgeColor(productDetails.status.status_name_key)}
                >
                  {productDetails.status.status_name_key}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {productDetails.tags && productDetails.tags.length > 0 && (
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              العلامات
            </h4>
            <div className="flex flex-wrap gap-2">
              {productDetails.tags.map((tag, index) => (
                <Badge key={index} size="sm" color="info">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
          <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
            معلومات التاريخ
          </h4>
          <div className="space-y-4">
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                تاريخ الإنشاء
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {formatDate(productDetails.created_at)}
              </p>
            </div>
            <div>
              <Label className="text-sm text-gray-500 dark:text-gray-400">
                تاريخ آخر تحديث
              </Label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {formatDate(productDetails.updated_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

