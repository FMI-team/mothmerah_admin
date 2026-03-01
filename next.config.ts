import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/:all*(svg|jpg|png|ico|txt)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },

  webpack(config, { dir }) {
    const projectDir = dir ?? __dirname;
    config.resolve = config.resolve ?? {};
    config.resolve.modules = [
      path.join(projectDir, "node_modules"),
      "node_modules",
    ];
    config.resolve.alias = {
      ...config.resolve.alias,
      tailwindcss: path.join(projectDir, "node_modules", "tailwindcss"),
    };
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