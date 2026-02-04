"use client";
import React from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function TopSellingCategories() {
  const options: ApexOptions = {
    colors: ["#9C27B0"],
    chart: {
      fontFamily: "Inter, sans-serif",
      type: "bar",
      height: 300,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        borderRadiusApplication: "end",
        dataLabels: {
          position: "top",
        },
      },
    },
    dataLabels: {
      enabled: true,
      offsetX: 10,
      style: {
        fontSize: "12px",
        colors: ["#6B7280"],
      },
    },
    xaxis: {
      categories: [
        "خضار",
        "فواكه",
        "محاصيل",
        "منتجات زراعية",
        "بذور",
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} وحدة`,
      },
    },
  };

  const series = [
    {
      name: "المبيعات",
      data: [99, 96, 98, 95, 97],
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/3 sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            الفئات الاكثر مبيعا
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-800 dark:text-white/90">
              1,205 وحدة
            </span>
            <span className="text-sm text-green-500 flex items-center gap-1">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6 2.5V9.5M6 2.5L3.5 5M6 2.5L8.5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              8%+
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            زيادة هذا الشهر
          </p>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div id="topCategoriesChart">
          <ReactApexChart
            options={options}
            series={series}
            type="bar"
            height={300}
          />
        </div>
      </div>
    </div>
  );
}

