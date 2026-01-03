import type { Metadata } from "next";
import React from "react";
import AuctionManagement from "@/components/auctions/AuctionManagement";

export const metadata: Metadata = {
  title: "ادارة المزادات | Commercial Buyer Auctions",
  description: "المزادات الانضمام للمزادات-مشتري(اضافة عرض سعر)",
};

export default function CommercialBuyerAuctionsPage() {
  return <AuctionManagement />;
}

