import RolesComponent from "@/components/roles/RolesPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "صفحة ادارة الادوار | Roles Management Page",
  description: "ادارة الادوار والاذونات والمستخدمين",
};

export default function RolesPage() {
  return <RolesComponent />;
}
