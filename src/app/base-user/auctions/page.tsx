import type { Metadata } from "next";
import BaseUserAuctionsPageComponent from "@/components/auctions/BaseUserAuctionsPage";

export const metadata: Metadata = {
  title: "ادارة المزادات | Base User Auctions",
  description: "ادارة المزادات للمستخدم الأساسي",
};

export default function BaseUserAuctionsPage() {
  return <BaseUserAuctionsPageComponent />;
}
