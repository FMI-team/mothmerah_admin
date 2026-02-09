import ProductDetailView from "@/components/products/ProductDetailView";
import { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "تفاصيل المنتج | Product Details",
  description: "عرض تفاصيل المنتج",
};

export default function ProductDetail() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          تفاصيل المنتج
        </h3>
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              جاري التحميل...
            </div>
          </div>
        }>
          <ProductDetailView />
        </Suspense>
      </div>
    </div>
  );
}

