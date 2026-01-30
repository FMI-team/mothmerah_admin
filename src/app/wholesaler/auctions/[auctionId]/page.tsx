import AuctionDetailView from "@/components/auctions/AuctionDetailView";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "تفاصيل المزاد | Auction Details",
  description: "عرض تفاصيل المزاد",
};

export default function WholesalerAuctionDetail() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                جاري التحميل...
              </div>
            </div>
          }
        >
          <AuctionDetailView />
        </Suspense>
      </div>
    </div>
  );
}
