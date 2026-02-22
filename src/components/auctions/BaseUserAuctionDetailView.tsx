"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Badge from "../ui/badge/Badge";
import Label from "../form/Label";
import { ChevronLeftIcon } from "@/icons";
import { readAuctionBidsById } from "../../../services/auctions";

interface ApiBid {
  auction_id: string;
  lot_id: string | null;
  bidder_user_id: string;
  bid_amount_per_unit: number;
  is_auto_bid: boolean;
  bid_id: number;
  bid_timestamp: string;
  bid_status: string;
}

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

function bidStatusLabel(status: string): string {
  if (status === "ACTIVE_HIGHEST") return "الأعلى";
  if (status === "OUTBID") return "تم تجاوزه";
  return status;
}

export default function BaseUserAuctionDetailView() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params?.auctionId as string;
  const [bids, setBids] = useState<ApiBid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBids = async () => {
      if (!auctionId) {
        setError("معرف المزاد غير متوفر");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await readAuctionBidsById(auctionId);
        const data = res?.data;
        const list = Array.isArray(data) ? data : [];
        setBids(list as ApiBid[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ في جلب المزايدات");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBids();
  }, [auctionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">جاري التحميل...</div>
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

  const auctionIdFromBids = bids[0]?.auction_id ?? auctionId;
  const highestBid = bids.find((b) => b.bid_status === "ACTIVE_HIGHEST");
  const sortedByAmount = [...bids].sort((a, b) => b.bid_amount_per_unit - a.bid_amount_per_unit);
  const maxAmount = sortedByAmount[0]?.bid_amount_per_unit;
  const minAmount = sortedByAmount[sortedByAmount.length - 1]?.bid_amount_per_unit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">تفاصيل المزاد</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">معرف المزاد: {auctionIdFromBids}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">ملخص المزايدات</h3>
            <div className="space-y-4">
              <div>
                <Label>معرف المزاد</Label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{auctionIdFromBids}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>عدد المزايدات</Label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{bids.length}</p>
                </div>
                <div>
                  <Label>أعلى مزايدة</Label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{maxAmount != null ? `${maxAmount.toFixed(2)} ر.س` : "—"}</p>
                </div>
                <div>
                  <Label>أدنى مزايدة</Label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">{minAmount != null ? `${minAmount.toFixed(2)} ر.س` : "—"}</p>
                </div>
                {highestBid && (
                  <div>
                    <Label>المزايدة الحالية الأعلى</Label>
                    <p className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">{highestBid.bid_amount_per_unit.toFixed(2)} ر.س</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">المزايدات ({bids.length})</h3>
            {bids.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد مزايدات حتى الآن</p>
            ) : (
              <div className="space-y-3">
                {bids.map((bid) => (
                  <div key={bid.bid_id} className="flex flex-wrap items-center justify-between gap-2 p-3 border border-gray-200 rounded-xl dark:border-gray-800">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-gray-800 dark:text-white/90">{bid.bid_amount_per_unit.toFixed(2)} ر.س</span>
                      <Badge size="sm" color={bid.bid_status === "ACTIVE_HIGHEST" ? "success" : "info"}>{bidStatusLabel(bid.bid_status)}</Badge>
                      {bid.is_auto_bid && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">تلقائي</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <span>{formatDate(bid.bid_timestamp)}</span>
                      <span className="font-mono text-xs">#{bid.bid_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
            <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">تفاصيل المزايدات</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">كل مزايدة تعرض: المبلغ لكل وحدة، الحالة (الأعلى / تم تجاوزه)، وقت المزايدة، ورقم المزايدة.</p>
            {bids.some((b) => b.lot_id) && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">بعض المزايدات مرتبطة بلوت محدد (lot_id).</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
