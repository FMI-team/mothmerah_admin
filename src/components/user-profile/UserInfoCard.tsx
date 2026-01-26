"use client";

import { UserDetails } from "./UserProfileView";
import { useTranslations } from "@/lib/translations";

interface UserInfoCardProps {
  userDetails?: UserDetails | null;
}

const formatDate = (dateString: string | null, t: (key: string) => string): string => {
  if (!dateString) return t("users.profile.infoCard.notAvailable");
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

export default function UserInfoCard({ userDetails }: UserInfoCardProps) {
  const { t } = useTranslations('ar');

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            {t("users.profile.infoCard.title")}
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("users.profile.infoCard.firstName")}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userDetails?.first_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("users.profile.infoCard.lastName")}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userDetails?.last_name || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("users.profile.infoCard.email")}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userDetails?.email || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("users.profile.infoCard.phoneNumber")}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userDetails?.phone_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("users.profile.infoCard.userId")}
              </p>
              <p className="text-xs font-mono font-medium text-gray-800 dark:text-white/90 break-all">
                {userDetails?.user_id || "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                {t("users.profile.infoCard.lastLogin")}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {userDetails?.last_login_timestamp
                  ? formatDate(userDetails.last_login_timestamp, t)
                  : t("users.profile.infoCard.neverLoggedIn")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
