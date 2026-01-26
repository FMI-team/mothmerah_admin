/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";
import { UserCircleIcon, MoreDotIcon, PlusIcon } from "@/icons";
import { getAuthHeader } from "@/lib/auth";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { useTranslations } from "@/lib/translations";

interface Translation {
  language_code: string;
  translated_status_name?: string;
  translated_role_name?: string;
  translated_user_type_name?: string;
  translated_description?: string | null;
  account_status_id?: number;
  role_id?: number;
  user_type_id?: number;
  user_verification_status_id?: number;
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

interface User {
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

interface UserVerificationStatusOption {
  user_verification_status_id: number;
  status_name_key: string;
}

const USER_VERIFICATION_STATUSES: UserVerificationStatusOption[] = [
  { user_verification_status_id: 1, status_name_key: "NOT_VERIFIED"},
  { user_verification_status_id: 2, status_name_key: "PENDING_REVIEW"},
  { user_verification_status_id: 3, status_name_key: "VERIFIED"},
  { user_verification_status_id: 4, status_name_key: "REJECTED"},
  { user_verification_status_id: 5, status_name_key: "ACTIVE"},
];

const getArabicTranslation = (
  translations: Translation[],
  field: "translated_status_name" | "translated_role_name" | "translated_user_type_name"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

const getVerificationStatusLabel = (
  statusNameKey: string,
  t: (key: string) => string
): string => {
  const key = `users.management.verificationStatuses.${statusNameKey}`;
  const translated = t(key);
  return translated === key ? statusNameKey : translated;
};

const formatDate = (dateString: string | null, t: (key: string) => string): string => {
  if (!dateString) return t("users.management.neverLoggedIn");
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

export default function UserManagement() {
  const router = useRouter();
  const { t } = useTranslations('ar');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUserForStatusChange, setSelectedUserForStatusChange] =
    useState<User | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [reasonForChange, setReasonForChange] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();


      const response = await fetch(
        `https://api-testing.mothmerah.sa/admin/users/`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(
        err instanceof Error ? err.message : t("users.management.errors.fetchFailed")
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length && users.length > 0) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.user_id));
    }
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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${t("users.management.delete.confirm")} "${userName}"؟`)) {
      return;
    }

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `https://api-testing.mothmerah.sa/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
          errorData.detail ||
          t("users.management.delete.failed")
        );
      }

      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== userId)
      );

      setSelectedUsers((prev) => prev.filter((id) => id !== userId));

      setError(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(
        err instanceof Error ? err.message : t("users.management.delete.error")
      );
    }
  };

  const handleOpenStatusModal = (user: User) => {
    setSelectedUserForStatusChange(user);
    setSelectedStatusId(user.user_verification_status_id);
    setReasonForChange("");
    setIsStatusModalOpen(true);
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedUserForStatusChange(null);
    setSelectedStatusId(null);
    setReasonForChange("");
  };

  const handleChangeUserStatus = async () => {
    if (!selectedUserForStatusChange || !selectedStatusId) {
      setError(t("users.management.errors.selectNewStatus"));
      return;
    }

    setIsChangingStatus(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `https://api-testing.mothmerah.sa/admin/users/${selectedUserForStatusChange.user_id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({
            new_status_id: selectedStatusId,
            reason_for_change: reasonForChange || "",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail
            .map((err: { msg: string; loc: string[] }) => err.msg)
            .join(", ");
          throw new Error(errorMessages || t("users.management.errors.changeStatusFailed"));
        }

        throw new Error(
          errorData.message ||
          errorData.detail ||
          t("users.management.errors.changeStatusFailed")
        );
      }

      await fetchUsers();
      handleCloseStatusModal();
    } catch (err) {
      console.error("Error changing user status:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("users.management.errors.changeStatusError")
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          {t("users.management.title")}
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          {t("users.management.description")}
        </p>
      </div>

      <button className="hidden items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-purple-600 lg:inline-flex">
        <PlusIcon className="w-4 h-4" />
        {t("users.management.addNewUser")}
      </button>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        {error && (
          <div className="mb-4 p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              {t("users.management.loading")}
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={
                            users.length > 0 &&
                            selectedUsers.length === users.length
                          }
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                        {t("users.management.tableHeaders.user")}
                      </div>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {t("users.management.tableHeaders.role")}
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {t("users.management.tableHeaders.lastLogin")}
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {t("users.management.tableHeaders.status")}
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      {t("users.management.tableHeaders.actions")}
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-12 text-center text-gray-500 dark:text-gray-400">
                        {t("users.management.noUsers")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const roleName = getArabicTranslation(
                        user.default_role.translations,
                        "translated_role_name"
                      );
                      const statusName = getArabicTranslation(
                        user.account_status.translations,
                        "translated_status_name"
                      );

                      return (
                        <TableRow key={user.user_id}>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedUsers.includes(user.user_id)}
                                onChange={() =>
                                  toggleUserSelection(user.user_id)
                                }
                                className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                              />
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 text-purple-500">
                                  <UserCircleIcon className="size-6" />
                                </div>
                                <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                  {`${user.first_name} ${user.last_name}`}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                            {roleName || user.default_role.role_name_key}
                          </TableCell>
                          <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                            {formatDate(user.last_login_timestamp, t)}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              size="sm"
                              color={getStatusBadgeColor(statusName)}
                            >
                              {statusName || user.account_status.status_name_key}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setActionDropdownOpen(
                                      actionDropdownOpen === user.user_id
                                        ? null
                                        : user.user_id
                                    )
                                  }
                                  className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                                >
                                  <MoreDotIcon className="w-5 h-5" />
                                </button>
                                <Dropdown
                                  isOpen={actionDropdownOpen === user.user_id}
                                  onClose={() => setActionDropdownOpen(null)}
                                  className="absolute left-0 mt-2 w-40 p-2 z-50"
                                >
                                  <DropdownItem
                                    onItemClick={() => {
                                      setActionDropdownOpen(null);
                                      router.push(`/profile?userId=${user.user_id}`);
                                    }}
                                    className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                  >
                                    {t("users.management.actions.viewDetails")}
                                  </DropdownItem>
                                  <DropdownItem
                                    onItemClick={() => {
                                      setActionDropdownOpen(null);
                                      handleOpenStatusModal(user);
                                    }}
                                    className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                  >
                                    {t("users.management.actions.changeStatus")}
                                  </DropdownItem>
                                  <DropdownItem
                                    onItemClick={() => {
                                      setActionDropdownOpen(null);
                                      handleDeleteUser(
                                        user.user_id,
                                        `${user.first_name} ${user.last_name}`
                                      );
                                    }}
                                    className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                                  >
                                    {t("users.management.actions.delete")}
                                  </DropdownItem>
                                </Dropdown>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
            {t("users.management.statusModal.title")}
          </h4>

          {selectedUserForStatusChange && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t("users.management.statusModal.user")}{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {`${selectedUserForStatusChange.first_name} ${selectedUserForStatusChange.last_name}`}
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t("users.management.statusModal.currentStatus")}{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {getArabicTranslation(
                      selectedUserForStatusChange.account_status.translations,
                      "translated_status_name"
                    ) || selectedUserForStatusChange.account_status.status_name_key}
                  </span>
                </p>
              </div>

              <div>
                <Label>
                  {t("users.management.statusModal.newStatus")} <span className="text-error-500">*</span>
                </Label>
                <select
                  value={String(selectedStatusId)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedStatusId(v === "" ? null : parseInt(v, 10));
                  }}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">{t("users.management.statusModal.selectStatus")}</option>
                  {(() => {
                    const currentId = selectedUserForStatusChange.user_verification_status_id;
                    const inList = USER_VERIFICATION_STATUSES.some(
                      (s) => s.user_verification_status_id === currentId
                    );
                    return (
                      <>
                        {!inList && (
                          <option
                            key={`current-${currentId}`}
                            value={String(currentId)}
                          >
                            {getVerificationStatusLabel(
                              selectedUserForStatusChange.user_verification_status.status_name_key,
                              t
                            )}
                          </option>
                        )}
                        {USER_VERIFICATION_STATUSES.map((status) => (
                          <option
                            key={status.user_verification_status_id}
                            value={String(status.user_verification_status_id)}
                          >
                            {getVerificationStatusLabel(status.status_name_key, t)}
                          </option>
                        ))}
                      </>
                    );
                  })()}
                </select>
              </div>

              <div>
                <Label>{t("users.management.statusModal.reasonLabel")}</Label>
                <textarea
                  placeholder={t("users.management.statusModal.reasonPlaceholder")}
                  value={reasonForChange}
                  onChange={(e) => setReasonForChange(e.target.value)}
                  rows={4}
                  className="h-auto w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              {error && (
                <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCloseStatusModal}
                  disabled={isChangingStatus}
                >
                  {t("users.management.statusModal.cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={handleChangeUserStatus}
                  disabled={isChangingStatus || !selectedStatusId}
                >
                  {isChangingStatus ? t("users.management.statusModal.updating") : t("users.management.statusModal.update")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

