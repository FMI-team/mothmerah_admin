import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  async headers() {
    return [
      {
        // 1. التخزين طويل الأمد للملفات الثابتة (chunks, صور, خطوط)
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // سنة واحدة
          },
        ],
      },
      {
        // 2. تطبيق على جميع صفحات HTML (أهم خطوة!)
        // هذا النمط يطابق: /signin, /dashboard, /, /products, الخ...
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            // لا تخزن HTML مؤقتاً على الإطلاق
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // 3. إعدادات خاصة بملفات المستوى الأعلى (أيقونة، ملف نصي)
        source: "/:all*(svg|jpg|png|ico|txt)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400", // يوم واحد
          },
        ],
      },
    ];
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
    
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;