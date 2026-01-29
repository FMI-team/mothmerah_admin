"use client";

import React, { useEffect, useState } from "react";
import { UserDetails } from "./UserProfileView";
import { useTranslations } from "@/lib/translations";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { PencilIcon } from "@/icons";

interface UserInfoCardProps {
  userDetails?: UserDetails | null;
  onEditSave?: (updated: Partial<UserDetails>) => void;
}

const formatDate = (
  dateString: string | null,
  t: (key: string) => string
): string => {
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
    return dateString || "";
  }
};

export default function UserInfoCard({ userDetails, onEditSave }: UserInfoCardProps) {
  const { t } = useTranslations("ar");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formValues, setFormValues] = useState({
    first_name: userDetails?.first_name ?? "",
    last_name: userDetails?.last_name ?? "",
    email: userDetails?.email ?? "",
    phone_number: userDetails?.phone_number ?? "",
  });

  useEffect(() => {
    setFormValues({
      first_name: userDetails?.first_name ?? "",
      last_name: userDetails?.last_name ?? "",
      email: userDetails?.email ?? "",
      phone_number: userDetails?.phone_number ?? "",
    });
  }, [userDetails]);

  const handleChange =
    (field: keyof typeof formValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEditSave?.(formValues);
    setIsEditOpen(false);
  };

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 lg:mb-6 mb-4">
              <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {t("users.profile.infoCard.title")}
              </h4>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-2 text-xs lg:text-sm py-1.5! lg:py-2!"
                onClick={() => setIsEditOpen(true)}
              >
                <PencilIcon className="w-4 h-4" />
                <span>{"تعديل"}</span>
              </Button>
            </div>

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

      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        className="max-w-[600px] p-5 lg:p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {"تعديل المعلومات الشخصية"}
          </h4>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="col-span-1">
              <Label>{t("users.profile.infoCard.firstName")}</Label>
              <input
                type="text"
                value={formValues.first_name}
                onChange={handleChange("first_name")}
                placeholder={t("users.profile.infoCard.firstName")}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div className="col-span-1">
              <Label>{t("users.profile.infoCard.lastName")}</Label>
              <input
                type="text"
                value={formValues.last_name}
                onChange={handleChange("last_name")}
                placeholder={t("users.profile.infoCard.lastName")}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div className="col-span-1">
              <Label>{t("users.profile.infoCard.email")}</Label>
              <input
                type="email"
                value={formValues.email}
                onChange={handleChange("email")}
                placeholder="name@example.com"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div className="col-span-1">
              <Label>{t("users.profile.infoCard.phoneNumber")}</Label>
              <input
                type="tel"
                value={formValues.phone_number}
                onChange={handleChange("phone_number")}
                placeholder="+9665xxxxxxxx"
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div className="flex items-center justify-end w-full gap-3 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
            >
              {"إلغاء"}
            </Button>
            <Button size="sm">
              {"حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
