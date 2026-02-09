import type { Metadata } from "next";
import React from "react";
import AdminAuctionManagement from "@/components/auctions/AdminAuctionManagement";

export const metadata: Metadata = {
  title: "ادارة المزادات | Auction Management",
  description: "ادارة المزادات وحالتها ونوعها",
};

export default function Auctions() {
  return <AdminAuctionManagement />;
}

