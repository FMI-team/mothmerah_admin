import type { Metadata } from "next";
import React from "react";
import UserManagement from "@/components/users/UserManagement";

export const metadata: Metadata = {
  title: "ادارة المستخدمين | User Management",
  description: "ادارة حسابات المستخدمين والادوار والاذونات",
};

export default function UsersPage() {
  return <UserManagement />;
}


