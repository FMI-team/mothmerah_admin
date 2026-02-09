import type { Metadata } from "next";
import React from "react";
import SettingsPage from "@/components/settings/SettingsPage";

export const metadata: Metadata = {
  title: "الاعدادات العامة | General Settings",
  description: "تحديث التكوينات والاعدادات العامة للمنصة",
};

export default function Settings() {
  return <SettingsPage />;
}

