"use client";

import { UserDetails } from "./UserProfileView";
import { useTranslations } from "@/lib/translations";

interface Translation {
  language_code: string;
  translated_status_name?: string;
  translated_role_name?: string;
  translated_user_type_name?: string;
}

const getArabicTranslation = (
  translations: Translation[],
  field: "translated_status_name" | "translated_role_name" | "translated_user_type_name"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

const formatDate = (dateString: string | null, t: (key: string) => string): string => {
  if (!dateString) return t("users.profile.addressCard.notAvailable");
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateString;
  }
};

interface UserAddressCardProps {
  userDetails?: UserDetails | null;
}

export default function UserAddressCard({ userDetails }: UserAddressCardProps) {
  const { t } = useTranslations('ar');

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
              {t("users.profile.addressCard.title")}
            </h4>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("users.profile.addressCard.defaultRole")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userDetails
                    ? getArabicTranslation(
                      userDetails.default_role.translations,
                      "translated_role_name"
                    ) || userDetails.default_role.role_name_key
                    : "N/A"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("users.profile.addressCard.userType")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userDetails
                    ? getArabicTranslation(
                      userDetails.user_type.translations,
                      "translated_user_type_name"
                    ) || userDetails.user_type.user_type_name_key
                    : "N/A"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("users.profile.addressCard.verificationStatus")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userDetails
                    ? getArabicTranslation(
                      userDetails.user_verification_status.translations,
                      "translated_status_name"
                    ) || userDetails.user_verification_status.status_name_key
                    : "N/A"}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("users.profile.addressCard.createdAt")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userDetails?.created_at
                    ? formatDate(userDetails.created_at, t)
                    : t("users.profile.addressCard.notAvailable")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("users.profile.addressCard.phoneVerifiedAt")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userDetails?.phone_verified_at
                    ? formatDate(userDetails.phone_verified_at, t)
                    : t("users.profile.addressCard.notVerified")}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                  {t("users.profile.addressCard.emailVerifiedAt")}
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {userDetails?.email_verified_at
                    ? formatDate(userDetails.email_verified_at, t)
                    : t("users.profile.addressCard.notVerified")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
