import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // ===== إضافة: إعدادات رؤوس التخزين المؤقت =====
  async headers() {
    return [
      {
        // تطبيق على جميع ملفات الـ Static Chunks و CSS
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            // التخزين لمدة سنة (للملفات التي لا تتغير)
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // تطبيق على الصفحة الرئيسية (لتجنب التخزين المطول)
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache",
          },
        ],
      },
      {
        // تطبيق على باقي الصفحات (اختياري)
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  // ===== نهاية الإضافة =====

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