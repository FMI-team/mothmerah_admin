"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import UserMetaCard from "./UserMetaCard";
import UserInfoCard from "./UserInfoCard";
import UserAddressCard from "./UserAddressCard";
import { fetchAndStoreUserInfo, logout, updateUserInfo } from "../../../services/auth";
import { readUserById } from "../../../services/users";
import { AxiosError } from "axios";

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
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const viewedUserId = searchParams.get("userId");

  useEffect(() => {
    const fetchUserDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = viewedUserId
          ? await readUserById(viewedUserId)
          : await fetchAndStoreUserInfo();
        if ((response.status as number) === 401) {
          logout();
        }

        if (response.status !== 200) {
          throw new Error("فشل في جلب بيانات المستخدم");
        }

        const data: UserDetails = response.data;
        setUserDetails(data);
      } catch (err) {
        const axiosErr = err as AxiosError<{ detail?: unknown }>;
        const detail = axiosErr.response?.data?.detail;
        setError(typeof detail === "string" ? detail : (axiosErr.message ?? "حدث خطأ في جلب بيانات المستخدم"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [viewedUserId]);

  const handleSaveInfo = async (updated: Partial<UserDetails>) => {
    try {
      setError(null);

      const body = {
        first_name: updated.first_name ?? userDetails?.first_name ?? "",
        last_name: updated.last_name ?? userDetails?.last_name ?? "",
        email: updated.email ?? userDetails?.email ?? "",
        phone_number: updated.phone_number ?? userDetails?.phone_number ?? "",
      };

      const response = await updateUserInfo(body);

      if (response.status !== 200) {
        throw new Error("فشل في تحديث بيانات المستخدم");
      }

      const data: UserDetails = response.data;
      setUserDetails(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تحديث بيانات المستخدم");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          جاري التحميل...
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
        لا يوجد بيانات
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserMetaCard userDetails={userDetails} />
      <UserInfoCard userDetails={userDetails} onEditSave={viewedUserId ? undefined : handleSaveInfo} />
      <UserAddressCard userDetails={userDetails} />
    </div>
  );
}

