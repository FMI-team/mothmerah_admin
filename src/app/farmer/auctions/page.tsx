import type { Metadata } from "next";
import React from "react";
import AuctionManagement from "@/components/auctions/AuctionManagement";

export const metadata: Metadata = {
  title: "ادارة المزادات | Farmer Auctions",
  description: "ادارة المزادات وحالتها ونوعها للمزارع",
};

export default function FarmerAuctionsPage() {
  return <AuctionManagement />;
}

