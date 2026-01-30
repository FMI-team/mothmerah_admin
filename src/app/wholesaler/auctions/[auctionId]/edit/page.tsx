import EditAuctionForm from "@/components/auctions/EditAuctionForm";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "تعديل المزاد | Edit Auction",
  description: "تعديل تفاصيل المزاد",
};

export default function WholesalerEditAuction() {
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
          <EditAuctionForm />
        </Suspense>
      </div>
    </div>
  );
}
