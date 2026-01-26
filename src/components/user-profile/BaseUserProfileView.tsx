"use client";
import React, { useState, useEffect } from "react";
import { getAuthHeader } from "@/lib/auth";
import UserMetaCard from "./UserMetaCard";
import UserInfoCard from "./UserInfoCard";
import UserAddressCard from "./UserAddressCard";
import { useTranslations } from "@/lib/translations";
import { UserDetails } from "./UserProfileView";

export default function BaseUserProfileView() {
  const { t } = useTranslations('ar');
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const authHeader = getAuthHeader();
        
        const meResponse = await fetch(
          "https://api-testing.mothmerah.sa/api/v1/users/me",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeader,
            },
          }
        );

        if (!meResponse.ok) {
          throw new Error("فشل في جلب معلومات المستخدم الحالي");
        }

        const userData: UserDetails = await meResponse.json();
        setUserDetails(userData);
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError(
          err instanceof Error ? err.message : "حدث خطأ في جلب بيانات المستخدم"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          {t("users.profile.loading") || "جاري التحميل..."}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
        {error}
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="p-4 text-sm text-gray-500 dark:text-gray-400">
        {t("users.profile.noData") || "لا توجد بيانات متاحة"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserMetaCard userDetails={userDetails} />
      <UserInfoCard userDetails={userDetails} />
      <UserAddressCard userDetails={userDetails} />
    </div>
  );
}
