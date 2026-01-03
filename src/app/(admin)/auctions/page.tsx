import type { Metadata } from "next";
import React from "react";
import AuctionManagement from "@/components/auctions/AuctionManagement";

export const metadata: Metadata = {
  title: "ادارة المزادات | Auction Management",
  description: "ادارة المزادات وحالتها ونوعها",
};

export default function Auctions() {
  return <AuctionManagement />;
}

