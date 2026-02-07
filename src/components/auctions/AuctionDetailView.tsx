/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { getAuthHeader } from "@/lib/auth";
import Badge from "../ui/badge/Badge";
import Label from "../form/Label";
import { ChevronLeftIcon, UserCircleIcon } from "@/icons";

interface Translation {
  language_code: string;
  translated_status_name?: string;
  translated_type_name?: string;
  translated_category_name?: string;
  translated_product_name?: string;
  translated_description?: string;
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
    translated_description?: string;
  }>;
  main_image_url: string | null;
}

interface Seller {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
}

interface Lot {
  lot_id: string;
  custom_lot_title: string | null;
  custom_lot_description: string | null;
  quantity_in_lot: number;
  lot_starting_price: number;
  translations: Translation[];
}

interface ApiAuction {
  auction_id: string;
  custom_auction_title: string | null;
  custom_auction_description: string | null;
  start_timestamp: string;
  end_timestamp: string;
  starting_price_per_unit: number;
  minimum_bid_increment: number;
  reserve_price_per_unit: number | null;
  current_highest_bid_amount_per_unit: number | null;
  current_highest_bidder_user_id: string | null;
  total_bids_count: number;
  quantity_offered: number;
  unit_of_measure_id_for_quantity: number;
  is_private_auction: boolean;
  seller: Seller;
  product: Product;
  auction_type: AuctionType;
  auction_status: AuctionStatus;
  lots: Lot[];
}

const getArabicTranslation = (
  translations: Translation[],
  field: "translated_status_name" | "translated_type_name" | "translated_category_name" | "translated_product_name" | "translated_description"
): string => {
  const ar = translations.find((t) => t.language_code === "ar");
  return ar?.[field] || "";
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
  if (status === "active" || status === "نشط") {
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

export default function AuctionDetailView() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const auctionId = params?.auctionId as string;
  const [auction, setAuction] = useState<ApiAuction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchAuctionDetails = async () => {
      if (!auctionId) {
        setError("معرف المزاد غير متوفر");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const authHeader = getAuthHeader();
        const response = await fetch(
          `http://127.0.0.1:8000/api/v1/auctions/${auctionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeader,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("المزاد غير موجود");
          }
          throw new Error("فشل في جلب تفاصيل المزاد");
        }

        const data: ApiAuction = await response.json();
        setAuction(data);
      } catch (err) {
        console.error("Error fetching auction details:", err);
        setError(
          err instanceof Error ? err.message : "حدث خطأ في جلب تفاصيل المزاد"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAuctionDetails();
  }, [auctionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
        {error || "المزاد غير موجود"}
      </div>
    );
  }

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

  const productDescription = getArabicTranslation(
    auction.product.translations,
    "translated_description"
  ) || "";

  const editHref = pathname ? `${pathname}/edit` : `/wholesaler/auctions/${auction.auction_id}/edit`;
  const listHref = pathname?.replace(/\/[^/]+$/, "") || "/wholesaler/auctions";

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا المزاد؟")) return;
    setIsDeleting(true);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://127.0.0.1:8000/api/v1/auctions/${auction.auction_id}`,
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
      router.push(listHref);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ في حذف المزاد"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
          {error}
        </div>
      )}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              تفاصيل المزاد
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {auction.custom_auction_title || "بدون عنوان"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={editHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600"
          >
            تعديل
          </a>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-error-300 bg-error-50 px-4 py-2.5 text-sm font-medium text-error-700 transition hover:bg-error-100 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400 dark:hover:bg-error-900/30 disabled:opacity-50"
          >
            {isDeleting ? "جاري الحذف..." : "حذف"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Auction Overview */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              معلومات المزاد
            </h3>
            <div className="space-y-4">
              <div>
                <Label>عنوان المزاد</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {auction.custom_auction_title || "بدون عنوان"}
                </p>
              </div>
              {auction.custom_auction_description && (
                <div>
                  <Label>وصف المزاد</Label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {auction.custom_auction_description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>نوع المزاد</Label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {typeName}
                  </p>
                </div>
                <div>
                  <Label>حالة المزاد</Label>
                  <div className="mt-1">
                    <Badge size="sm" color={getStatusBadgeColor(statusName)}>
                      {statusName}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>مزاد خاص</Label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {auction.is_private_auction ? "نعم" : "لا"}
                  </p>
                </div>
                <div>
                  <Label>عدد المزايدات</Label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {auction.total_bids_count}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              معلومات المنتج
            </h3>
            <div className="space-y-4">
              {auction.product.main_image_url && (
                <div className="w-full max-w-xs overflow-hidden border border-gray-200 rounded-xl dark:border-gray-800">
                  <img src={auction.product.main_image_url} alt={productName} className="w-full h-auto object-cover" />
                </div>
              )}
              <div>
                <Label>اسم المنتج</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {productName}
                </p>
              </div>
              {productDescription && (
                <div>
                  <Label>وصف المنتج</Label>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {productDescription}
                  </p>
                </div>
              )}
              <div>
                <Label>الفئة</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {categoryName}
                </p>
              </div>
            </div>
          </div>

          {/* Lots Information */}
          {auction.lots && auction.lots.length > 0 && (
            <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                اللوتات ({auction.lots.length})
              </h3>
              <div className="space-y-4">
                {auction.lots.map((lot, index) => (
                  <div
                    key={lot.lot_id}
                    className="p-4 border border-gray-200 rounded-xl dark:border-gray-800"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-800 dark:text-white/90">
                        {lot.custom_lot_title || `لوت ${index + 1}`}
                      </h4>
                    </div>
                    {lot.custom_lot_description && (
                      <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                        {lot.custom_lot_description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">الكمية: </span>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {lot.quantity_in_lot}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">السعر الابتدائي: </span>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {lot.lot_starting_price.toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Information */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              معلومات التسعير
            </h3>
            <div className="space-y-4">
              <div>
                <Label>السعر الابتدائي لكل وحدة</Label>
                <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white/90">
                  {auction.starting_price_per_unit.toFixed(2)} ر.س
                </p>
              </div>
              <div>
                <Label>أعلى مزايدة حالية</Label>
                <p className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                  {(auction.current_highest_bid_amount_per_unit || auction.starting_price_per_unit).toFixed(2)} ر.س
                </p>
              </div>
              <div>
                <Label>الحد الأدنى للزيادة</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {auction.minimum_bid_increment.toFixed(2)} ر.س
                </p>
              </div>
              {auction.reserve_price_per_unit && (
                <div>
                  <Label>السعر الاحتياطي</Label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {auction.reserve_price_per_unit.toFixed(2)} ر.س
                  </p>
                </div>
              )}
              <div>
                <Label>الكمية المعروضة</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {auction.quantity_offered}
                </p>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              معلومات البائع
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 text-purple-500">
                  <UserCircleIcon className="size-8" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {`${auction.seller.first_name} ${auction.seller.last_name}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {auction.seller.email}
                  </p>
                </div>
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {auction.seller.phone_number}
                </p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
              التواريخ
            </h3>
            <div className="space-y-4">
              <div>
                <Label>تاريخ البدء</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(auction.start_timestamp)}
                </p>
              </div>
              <div>
                <Label>تاريخ الانتهاء</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {formatDate(auction.end_timestamp)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
