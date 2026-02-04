/* eslint-disable @next/next/no-img-element */
"use client";

import { UserDetails } from "./UserProfileView";
import Badge from "../ui/badge/Badge";
import { UserCircleIcon } from "@/icons";

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

const getStatusBadgeColor = (statusName: string): "success" | "warning" | "error" => {
  const status = statusName.toLowerCase();
  if (status === "نشط" || status === "active") {
    return "success";
  }
  if (status === "قيد الانتظار" || status.includes("pending")) {
    return "warning";
  }
  if (status === "معلق" || status.includes("suspended")) {
    return "error";
  }
  return "warning";
};

interface UserMetaCardProps {
  userDetails?: UserDetails | null;
}

export default function UserMetaCard({ userDetails }: UserMetaCardProps) {
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              {userDetails?.profile_picture_url ? (
                <img src={userDetails.profile_picture_url} alt={userDetails ? `${userDetails.first_name} ${userDetails.last_name}` : "user"} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <UserCircleIcon className="text-purple-500" />
                </div>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {userDetails
                  ? `${userDetails.first_name} ${userDetails.last_name}`
                  : "N/A"}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userDetails
                    ? getArabicTranslation(
                      userDetails.default_role.translations,
                      "translated_role_name"
                    ) || userDetails.default_role.role_name_key
                    : "N/A"}
                </p>
                {userDetails && (
                  <>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getArabicTranslation(
                        userDetails.user_type.translations,
                        "translated_user_type_name"
                      ) || userDetails.user_type.user_type_name_key}
                    </p>
                    <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                    <Badge
                      size="sm"
                      color={getStatusBadgeColor(
                        getArabicTranslation(
                          userDetails.account_status.translations,
                          "translated_status_name"
                        ) || userDetails.account_status.status_name_key
                      )}
                    >
                      {getArabicTranslation(
                        userDetails.account_status.translations,
                        "translated_status_name"
                      ) || userDetails.account_status.status_name_key}
                    </Badge>
                  </>
                )}
                {!userDetails && (
                  <div></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
