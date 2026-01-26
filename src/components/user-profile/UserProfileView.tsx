/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getAuthHeader } from "@/lib/auth";
import UserMetaCard from "./UserMetaCard";
import UserInfoCard from "./UserInfoCard";
import UserAddressCard from "./UserAddressCard";
import { useTranslations } from "@/lib/translations";

interface Translation {
  language_code: string;
  translated_status_name?: string;
  translated_role_name?: string;
  translated_user_type_name?: string;
  translated_description?: string | null;
}

interface AccountStatus {
  status_name_key: string;
  is_terminal: boolean;
  account_status_id: number;
  translations: Translation[];
}

interface UserType {
  user_type_name_key: string;
  user_type_id: number;
  translations: Translation[];
}

interface DefaultRole {
  role_name_key: string;
  is_active: boolean;
  role_id: number;
  created_at: string;
  updated_at: string;
  translations: Translation[];
}

interface UserVerificationStatus {
  status_name_key: string;
  description_key: string;
  user_verification_status_id: number;
  created_at: string;
  updated_at: string;
  translations: Translation[];
}

interface PreferredLanguage {
  language_code: string;
  language_name_native: string;
  language_name_en: string;
  text_direction: string;
  is_active_for_interface: boolean;
  sort_order: number;
  created_at: string;
}

export interface UserDetails {
  phone_number: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  default_user_role_id: number;
  user_verification_status_id: number;
  preferred_language_code: string;
  user_id: string;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  last_login_timestamp: string | null;
  last_activity_timestamp: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  updated_by_user_id: string | null;
  additional_data: unknown | null;
  account_status: AccountStatus;
  user_type: UserType;
  default_role: DefaultRole;
  user_verification_status: UserVerificationStatus;
  preferred_language: PreferredLanguage;
}

export default function UserProfileView() {
  const searchParams = useSearchParams();
  const { t } = useTranslations('ar');
  const userId = searchParams.get("userId");
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) {
        setError(t("users.profile.errors.userIdMissing"));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const authHeader = getAuthHeader();
        const response = await fetch(
          `https://api-testing.mothmerah.sa/admin/users/${userId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...authHeader,
            },
          }
        );

        if (!response.ok) {
          throw new Error(t("users.profile.errors.fetchFailed"));
        }

        const data: UserDetails = await response.json();
        setUserDetails(data);
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError(
          err instanceof Error ? err.message : t("users.profile.errors.fetchError")
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          {t("users.profile.loading")}
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
        {t("users.profile.noData")}
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

