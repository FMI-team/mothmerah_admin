"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Badge from "../ui/badge/Badge";
import { UserCircleIcon, MoreDotIcon, PlusIcon } from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { readUsers, updateUserStatus } from "../../../services/users";
import { AxiosError } from "axios";
import AddUserForm from "./AddUserForm";

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

interface AccountStatusOption {
  account_status_id: number;
  status_name_key: string;
  is_terminal: boolean;
}

const ACCOUNT_STATUSES: AccountStatusOption[] = [
  { account_status_id: 1, status_name_key: "PENDING_ACTIVATION", is_terminal: false },
  { account_status_id: 2, status_name_key: "ACTIVE", is_terminal: false },
  { account_status_id: 4, status_name_key: "DELETED", is_terminal: true }
];

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  PENDING_ACTIVATION: "قيد التفعيل",
  ACTIVE: "نشط",
  DELETED: "محذوف"
};

const getArabicTranslation = (
  translations: Translation[],
  field: "translated_status_name" | "translated_role_name" | "translated_user_type_name"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

const getAccountStatusLabel = (
  status: { status_name_key: string; translations?: { language_code: string; translated_status_name?: string }[] }
): string => {
  const ar = status.translations?.find((x) => x.language_code === "ar");
  if (ar?.translated_status_name) return ar.translated_status_name;
  return ACCOUNT_STATUS_LABELS[status.status_name_key] || status.status_name_key;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "لم يتم تسجيل الدخول";
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedUserForStatusChange, setSelectedUserForStatusChange] = useState<User | null>(null);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [reasonForChange, setReasonForChange] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [view, setView] = useState<"list" | "add">("list");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await readUsers({ include_deleted: true });
      if (response.status !== 200) {
        throw new Error("Failed to fetch users");
      }
      const data = response.data;
      setUsers(data || []);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setError(typeof detail === "string" ? detail : (axiosError.message ?? "فشل في جلب المستخدمين"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
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
    if (status === "قيد التفعيل" || status.includes("pending")) {
      return "warning";
    }
    if (status === "معلق" || status.includes("suspended")) {
      return "error";
    }
    if (status === "محذوف" || status === "deleted") {
      return "error";
    }
    return "warning";
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟ سيتم تغيير حالته إلى "محذوف" وستبقى بياناته في النظام.`)) {
      return;
    }

    const deletedStatusId = 4;
    try {
      const response = await updateUserStatus(userId, {
        new_status_id: deletedStatusId,
        reason_for_change: "حذف من لوحة التحكم",
      });

      if (response.status !== 200) {
        const data = response.data as { detail?: unknown };
        const detail = data.detail;
        throw new Error(typeof detail === "string" ? detail : "فشل في تغيير الحالة");
      }

      await fetchUsers();
      setSelectedUsers((prev) => prev.filter((id) => id !== userId));
      setError(null);
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setError(typeof detail === "string" ? detail : (axiosError.message ?? "فشل في حذف المستخدم"));
    }
  };

  const handleOpenStatusModal = (user: User) => {
    setSelectedUserForStatusChange(user);
    setSelectedStatusId(user.account_status.account_status_id);
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
      setError("يرجى تحديد الحالة الجديدة");
      return;
    }

    setIsChangingStatus(true);
    setError(null);

    try {
      const response = await updateUserStatus(selectedUserForStatusChange.user_id, {new_status_id: selectedStatusId, reason_for_change: reasonForChange})

      if (response.status !== 200) {
        const data = response.data as { detail?: unknown };
        const detail = data.detail;
        setError(typeof detail === "string" ? detail : "فشل في تغيير الحالة");
      }

      const updatedUser: User = response.data;
      setUsers((prev) =>
        prev.map((u) => (u.user_id === updatedUser.user_id ? updatedUser : u))
      );
      handleCloseStatusModal();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setError(typeof detail === "string" ? detail : (axiosError.message ?? "فشل في تغيير الحالة"));
    } finally {
      setIsChangingStatus(false);
    }
  };

  if (view === "add") {
    return (
      <AddUserForm
        onCancel={() => setView("list")}
        onCreated={() => {
          setView("list");
          fetchUsers();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">المستخدمين</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">ادارة المستخدمين</p>
      </div>

      <button onClick={() => setView("add")} className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs
      hover:bg-purple-600">
        <PlusIcon className="w-4 h-4" />
        اضافة مستخدم جديد
      </button>
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        {error && (
          <div className="mb-4 p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">{error}</div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">جاري التحميل...</div>
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                  <TableRow>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={users.length > 0 && selectedUsers.length === users.length} onChange={toggleSelectAll} className="w-4 h-4 text-brand-500 border-gray-300
                        rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" />
                        اسم المستخدم
                      </div>
                    </TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الدور</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">آخر تسجيل دخول</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الحالة</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الاجراءات</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-12 text-center text-gray-500 dark:text-gray-400">لا يوجد مستخدمين</TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const roleName = getArabicTranslation(
                        user.default_role.translations,
                        "translated_role_name"
                      );
                      const statusName = getAccountStatusLabel(user.account_status);

                      return (
                        <TableRow key={user.user_id}>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={selectedUsers.includes(user.user_id)} onChange={() => toggleUserSelection(user.user_id)} className="w-4 h-4 text-brand-500
                              border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" />
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 text-purple-500">
                                  <UserCircleIcon className="size-6" />
                                </div>
                                <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">{`${user.first_name} ${user.last_name}`}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">{roleName || user.default_role.role_name_key}</TableCell>
                          <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">{formatDate(user.last_login_timestamp)}</TableCell>
                          <TableCell className="py-3">
                            <Badge size="sm" color={getStatusBadgeColor(statusName)}>{statusName}</Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <button onClick={() => setActionDropdownOpen(actionDropdownOpen === user.user_id ? null : user.user_id)} className="p-1.5 text-gray-500 rounded-lg
                                hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
                                  <MoreDotIcon className="w-5 h-5" />
                                </button>
                                <Dropdown isOpen={actionDropdownOpen === user.user_id} onClose={() => setActionDropdownOpen(null)} className="absolute left-0 mt-2 w-40 p-2 z-50">
                                  <DropdownItem onItemClick={() => {
                                    setActionDropdownOpen(null);
                                    router.push(`/admin/profile?userId=${user.user_id}`);
                                  }} className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400
                                  dark:hover:bg-white/5 dark:hover:text-gray-300">
                                    عرض التفاصيل
                                  </DropdownItem>
                                  <DropdownItem onItemClick={() => {
                                    setActionDropdownOpen(null);
                                    handleOpenStatusModal(user);
                                  }} className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400
                                  dark:hover:bg-white/5 dark:hover:text-gray-300">
                                    تغيير الحالة
                                  </DropdownItem>
                                  <DropdownItem onItemClick={() => {
                                    setActionDropdownOpen(null);
                                    handleDeleteUser(user.user_id, `${user.first_name} ${user.last_name}`);
                                  }} className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5
                                  dark:hover:text-red-300">
                                    حذف المستخدم
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

      <Modal isOpen={isStatusModalOpen} onClose={handleCloseStatusModal} className="max-w-[600px] p-5 lg:p-10">
        <div className="space-y-6">
          <h4 className="font-semibold text-gray-800 text-title-sm dark:text-white/90">تغيير الحالة</h4>

          {selectedUserForStatusChange && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">اسم المستخدم
                  <span className="font-medium text-gray-800 dark:text-white/90">{`${selectedUserForStatusChange.first_name} ${selectedUserForStatusChange.last_name}`}</span>
                  {getAccountStatusLabel(selectedUserForStatusChange.account_status)}
                </p>
              </div>

              <div>
                <Label>الحالة الجديدة <span className="text-error-500">*</span></Label>
                <select value={String(selectedStatusId)} onChange={(e) => {
                    const v = e.target.value;
                    setSelectedStatusId(v === "" ? null : parseInt(v, 10));
                  }} className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden
                  focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800">
                  <option value="">اختر الحالة</option>
                  {ACCOUNT_STATUSES.map((status) => (
                    <option key={status.account_status_id} value={String(status.account_status_id)}>
                      {ACCOUNT_STATUS_LABELS[status.status_name_key] || status.status_name_key}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>السبب</Label>
                <textarea placeholder="أدخل السبب" value={reasonForChange} onChange={(e) => setReasonForChange(e.target.value)} rows={4} className="h-auto w-full rounded-lg border
                border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3
                focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
              </div>

              {error && (
                <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">{error}</div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button size="sm" variant="outline" onClick={handleCloseStatusModal} disabled={isChangingStatus}>الغاء</Button>
                <Button size="sm" onClick={handleChangeUserStatus} disabled={isChangingStatus || !selectedStatusId}>{isChangingStatus ? "جاري التحديث" : "تحديث"}</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}