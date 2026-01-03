import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "لوحة التحكم | Wholesaler Dashboard",
  description: "لوحة التحكم للجملة",
};

export default function WholesalerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          لوحة التحكم
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          مرحبا بعودتك إليك نظرة عامة على السوق
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                المطالبات المعلقات
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                12
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>1.3%+</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                الطلبات الجديدة
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                13
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>1.3%+</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                المستخدمون النشطون
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                8,950
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>1.3%+</span>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                اجمالي الإيرادات
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-white/90">
                1,234,567
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-sm text-success-600 dark:text-success-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>5.3%+</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <p className="text-center text-gray-500 dark:text-gray-400">
          لوحة تحكم الجملة - قريباً
        </p>
      </div>
    </div>
  );
}

