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

interface VerificationStatusTranslation {
  language_code: string;
  translated_status_name: string;
  translated_description: string | null;
  user_verification_status_id: number;
}

interface VerificationStatus {
  status_name_key: string;
  description_key: string;
  user_verification_status_id: number;
  created_at: string;
  updated_at: string;
  translations: VerificationStatusTranslation[];
}

const getArabicTranslation = (
  translations: Translation[],
  field: "translated_status_name" | "translated_role_name" | "translated_user_type_name"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

const getVerificationStatusArabicTranslation = (
  translations: VerificationStatusTranslation[] | Translation[]
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  if (arabicTranslation) {
    // Check if it's VerificationStatusTranslation (has required translated_status_name)
    if ("translated_status_name" in arabicTranslation && typeof arabicTranslation.translated_status_name === "string") {
      return arabicTranslation.translated_status_name;
    }
    // Otherwise it's Translation (has optional translated_status_name)
    return (arabicTranslation as Translation).translated_status_name || "";
  }
  return "";
};

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "لم يسجل دخول";
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
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [selectedRole, setSelectedRole] = useState("الكل");
  // const [selectedStatus, setSelectedStatus] = useState("الكل");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUserForStatusChange, setSelectedUserForStatusChange] =
    useState<User | null>(null);
  const [verificationStatuses, setVerificationStatuses] = useState<
    VerificationStatus[]
  >([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [reasonForChange, setReasonForChange] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();


      const response = await fetch(
        `http://127.0.0.1:8000/admin/users`,
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
        err instanceof Error ? err.message : "حدث خطأ في جلب البيانات"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  // }, [selectedRole, selectedStatus]);
  }, [fetchUsers]);

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
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟`)) {
      return;
    }

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://127.0.0.1:8000/admin/users/${userId}`,
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
            "فشل في حذف المستخدم"
        );
      }

      // Remove user from list
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== userId)
      );
      
      // Remove from selected users if selected
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));

      // Show success message (you can replace this with a toast notification)
      setError(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ أثناء حذف المستخدم"
      );
    }
  };

  const fetchVerificationStatuses = useCallback(async () => {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        "http://127.0.0.1:8000/admin/admin/verification/user-verification-statuses",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch verification statuses");
      }

      const data: VerificationStatus[] = await response.json();
      setVerificationStatuses(data);
    } catch (err) {
      console.error("Error fetching verification statuses:", err);
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ في جلب حالات التحقق"
      );
    }
  }, []);

  const handleOpenStatusModal = (user: User) => {
    setSelectedUserForStatusChange(user);
    setSelectedStatusId(user.user_verification_status_id);
    setReasonForChange("");
    setIsStatusModalOpen(true);
    fetchVerificationStatuses();
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalOpen(false);
    setSelectedUserForStatusChange(null);
    setSelectedStatusId(null);
    setReasonForChange("");
  };

  const handleChangeUserStatus = async () => {
    if (!selectedUserForStatusChange || !selectedStatusId) {
      setError("يرجى اختيار حالة جديدة");
      return;
    }

    setIsChangingStatus(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      const response = await fetch(
        `http://127.0.0.1:8000/admin/users/${selectedUserForStatusChange.user_id}/status`,
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
        
        // Handle validation errors
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail
            .map((err: { msg: string; loc: string[] }) => err.msg)
            .join(", ");
          throw new Error(errorMessages || "فشل في تغيير حالة المستخدم");
        }
        
        throw new Error(
          errorData.message ||
            errorData.detail ||
            "فشل في تغيير حالة المستخدم"
        );
      }

      // Refresh users list to get updated status
      await fetchUsers();
      handleCloseStatusModal();
    } catch (err) {
      console.error("Error changing user status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء تغيير حالة المستخدم"
      );
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          ادارة المستخدمين
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          ادارة حسابات المستخدمين والادوار والاذونات
        </p>
      </div>

      {/* Filters and Search */}
      <button className="hidden items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-purple-600 lg:inline-flex">
            <PlusIcon className="w-4 h-4" />
            إضافة مستخدم جديد (قريبا)
          </button>
      {/* <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                }}
                className="h-11 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="الكل">الدور: الكل</option>
                <option value="مسؤول">مسؤول</option>
                <option value="بائع">بائع</option>
                <option value="عميل">عميل</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                }}
                className="h-11 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="الكل">الحالة: الكل</option>
                <option value="نشط">نشط</option>
                <option value="قيد الانتظار">قيد الانتظار</option>
                <option value="معلق">معلق</option>
              </select>
            </div>

            <div className="relative flex-1 sm:max-w-md">
              <span className="absolute -translate-y-1/2 right-4 top-1/2 pointer-events-none">
                <svg
                  className="fill-gray-500 dark:fill-gray-400"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                    fill=""
                  />
                </svg>
              </span>
              <input
                type="text"
                placeholder="ابحث بالاسم او البريد الالكتروني او المعرف..."
                className="h-11 w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-12 pl-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>
        </div>
      </div> */}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        {error && (
          <div className="mb-4 p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              جاري التحميل...
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
                        المستخدم
                      </div>
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      الدور
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      اخر تسجيل دخول
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      الحالة
                    </TableCell>
                    <TableCell
                      isHeader
                      className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      الاجراءات
                    </TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-12 text-center text-gray-500 dark:text-gray-400">
                        لا يوجد مستخدمين
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
                            {formatDate(user.last_login_timestamp)}
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
                                    عرض التفاصيل
                                  </DropdownItem>
                                  <DropdownItem
                                    onItemClick={() => {
                                      setActionDropdownOpen(null);
                                      handleOpenStatusModal(user);
                                    }}
                                    className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                                  >
                                    تعديل الحالة
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
                                    حذف
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

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={handleCloseStatusModal}
        className="max-w-[600px] p-5 lg:p-10"
      >
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">
            تعديل حالة المستخدم
          </h4>

          {selectedUserForStatusChange && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  المستخدم:{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {`${selectedUserForStatusChange.first_name} ${selectedUserForStatusChange.last_name}`}
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  الحالة الحالية:{" "}
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {getVerificationStatusArabicTranslation(
                      selectedUserForStatusChange.user_verification_status
                        .translations
                    ) ||
                      selectedUserForStatusChange.user_verification_status
                        .status_name_key}
                  </span>
                </p>
              </div>

              <div>
                <Label>
                  الحالة الجديدة <span className="text-error-500">*</span>
                </Label>
                <select
                  value={selectedStatusId || ""}
                  onChange={(e) =>
                    setSelectedStatusId(parseInt(e.target.value, 10))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">اختر الحالة</option>
                  {verificationStatuses.map((status) => {
                    const arabicName = getVerificationStatusArabicTranslation(
                      status.translations
                    );
                    return (
                      <option
                        key={status.user_verification_status_id}
                        value={status.user_verification_status_id}
                      >
                        {arabicName || status.status_name_key}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <Label>سبب التغيير (اختياري)</Label>
                <textarea
                  placeholder="أدخل سبب تغيير الحالة..."
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
                  إلغاء
                </Button>
                <Button
                  size="sm"
                  onClick={handleChangeUserStatus}
                  disabled={isChangingStatus || !selectedStatusId}
                >
                  {isChangingStatus ? "جاري التحديث..." : "تحديث الحالة"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

