"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { getAuthHeader } from "@/lib/auth";
import Label from "../form/Label";
import { ChevronLeftIcon } from "@/icons";

const AUCTION_TYPES = [
  { auction_type_id: 1, type_name_key: "STANDARD_ENGLISH_AUCTION", label: "مزاد إنجليزي قياسي" },
];

const AUCTION_STATUSES = [
  { auction_status_id: 1, status_name_key: "SCHEDULED", label: "مجدول" },
  { auction_status_id: 2, status_name_key: "ACTIVE", label: "نشط" },
  { auction_status_id: 3, status_name_key: "CLOSED", label: "مغلق" },
  { auction_status_id: 4, status_name_key: "CANCELLED", label: "ملغى" },
  { auction_status_id: 5, status_name_key: "UPCOMING", label: "قادم" },
];

interface ApiAuction {
  auction_id: string;
  seller_user_id: string;
  product_id: string;
  auction_type_id: number;
  auction_status_id: number;
  start_timestamp: string;
  end_timestamp: string;
  starting_price_per_unit: number;
  minimum_bid_increment: number;
  custom_auction_title: string | null;
}

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export default function EditAuctionForm() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const auctionId = params?.auctionId as string;

  const [auction, setAuction] = useState<ApiAuction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [auctionTypeId, setAuctionTypeId] = useState<string>("1");
  const [auctionStatusId, setAuctionStatusId] = useState<string>("");
  const [startTimestamp, setStartTimestamp] = useState<string>("");
  const [endTimestamp, setEndTimestamp] = useState<string>("");
  const [startingPricePerUnit, setStartingPricePerUnit] = useState<string>("");
  const [minimumBidIncrement, setMinimumBidIncrement] = useState<string>("");

  const fetchAuction = useCallback(async () => {
    if (!auctionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `https://api-testing.mothmerah.sa/api/v1/auctions/${auctionId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", ...authHeader },
        }
      );
      if (!response.ok) {
        if (response.status === 404) throw new Error("المزاد غير موجود");
        throw new Error("فشل في جلب تفاصيل المزاد");
      }
      const data: ApiAuction = await response.json();
      setAuction(data);
      setAuctionTypeId(String(data.auction_type_id));
      setAuctionStatusId(String(data.auction_status_id));
      setStartTimestamp(toDatetimeLocal(data.start_timestamp));
      setEndTimestamp(toDatetimeLocal(data.end_timestamp));
      setStartingPricePerUnit(String(data.starting_price_per_unit));
      setMinimumBidIncrement(String(data.minimum_bid_increment));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في جلب المزاد");
    } finally {
      setIsLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auctionId || !auction) return;

    const start = startTimestamp ? new Date(startTimestamp).toISOString() : auction.start_timestamp;
    const end = endTimestamp ? new Date(endTimestamp).toISOString() : auction.end_timestamp;
    const body = {
      seller_user_id: auction.seller_user_id,
      product_id: auction.product_id,
      auction_type_id: parseInt(auctionTypeId, 10) || 1,
      auction_status_id: parseInt(auctionStatusId, 10) || 1,
      start_timestamp: start,
      end_timestamp: end,
      starting_price_per_unit: parseFloat(startingPricePerUnit) || 0,
      minimum_bid_increment: parseFloat(minimumBidIncrement) || 0,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `https://api-testing.mothmerah.sa/api/v1/auctions/${auctionId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { detail?: string })?.detail || "فشل في تحديث المزاد"
        );
      }
      const basePath = pathname?.replace(/\/edit$/, "") || "";
      router.push(basePath ? `${basePath}` : `/wholesaler/auctions/${auctionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في التحديث");
    } finally {
      setIsSubmitting(false);
    }
  };

  const basePath = pathname?.replace(/\/edit$/, "") || "";
  const detailPath = basePath || `/wholesaler/auctions/${auctionId}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  if (error && !auction) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ChevronLeftIcon className="w-5 h-5" />
          رجوع
        </button>
        <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push(detailPath)}
          className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            تعديل المزاد
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {auction?.custom_auction_title || "بدون عنوان"}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="auction_type_id">نوع المزاد</Label>
            <select
              id="auction_type_id"
              value={auctionTypeId}
              onChange={(e) => setAuctionTypeId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {AUCTION_TYPES.map((t) => (
                <option key={t.auction_type_id} value={String(t.auction_type_id)}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="auction_status_id">حالة المزاد</Label>
            <select
              id="auction_status_id"
              value={auctionStatusId}
              onChange={(e) => setAuctionStatusId(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            >
              {AUCTION_STATUSES.map((s) => (
                <option key={s.auction_status_id} value={String(s.auction_status_id)}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="start_timestamp">تاريخ ووقت البدء</Label>
            <input
              id="start_timestamp"
              type="datetime-local"
              value={startTimestamp}
              onChange={(e) => setStartTimestamp(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>
          <div>
            <Label htmlFor="end_timestamp">تاريخ ووقت الانتهاء</Label>
            <input
              id="end_timestamp"
              type="datetime-local"
              value={endTimestamp}
              onChange={(e) => setEndTimestamp(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="starting_price_per_unit">السعر الابتدائي لكل وحدة (ر.س)</Label>
            <input
              id="starting_price_per_unit"
              type="number"
              step="0.01"
              min="0"
              value={startingPricePerUnit}
              onChange={(e) => setStartingPricePerUnit(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>
          <div>
            <Label htmlFor="minimum_bid_increment">الحد الأدنى للزيادة (ر.س)</Label>
            <input
              id="minimum_bid_increment"
              type="number"
              step="0.01"
              min="0"
              value={minimumBidIncrement}
              onChange={(e) => setMinimumBidIncrement(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(detailPath)}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/3 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </form>
    </div>
  );
}
