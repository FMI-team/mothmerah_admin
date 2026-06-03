"use client";

import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { UserCircleIcon, GroupIcon, TaskIcon, BoxIconLine, DollarLineIcon, PieChartIcon, PlugInIcon, DocsIcon, TrashBinIcon, CheckCircleIcon, PlusIcon } from "@/icons";
import { createUser } from "../../../services/users";
import { assignPermissionToRole, createNewRole, readAllPermissions, readPermissionOfRole, readRoles, removePermissionFromRole } from "../../../services/roles";

interface RoleTranslation {
  language_code: string;
  translated_role_name?: string;
}

interface ApiRole {
  role_id: number;
  role_name_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  translations: RoleTranslation[];
}

interface Permission {
  permission_id: number;
  permission_name_key: string;
  module_group: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PermissionsByModule {
  module_group: string;
  permissions: Permission[];
}

interface RoleWithPermissions extends ApiRole {
  permissions: Permission[];
}

const ROLE_ICONS = [GroupIcon, BoxIconLine, TaskIcon, DocsIcon, PieChartIcon, PlugInIcon];

const getArabicRoleName = (role: ApiRole): string => {
  const ar = role.translations?.find((t) => t.language_code === "ar");
  return ar?.translated_role_name || role.role_name_key;
};

function apiDetailToString(detail: unknown): string {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return (
      detail.map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg?: string }).msg) : String(d))).filter(Boolean).join(" — ") || ""
    );
  }
  if (typeof detail === "object" && detail !== null && "msg" in detail) return String((detail as { msg: unknown }).msg);
  return String(detail);
}

const LANGUAGE_OPTIONS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" }
];

const defaultCreateRoleForm = () => ({
  role_name_key: "",
  language_code: "ar",
  translated_role_name: ""
});

const formatArabicDate = (date: Date): string => {
  try {
    return new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long", day: "numeric" }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
};

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder-white/30 dark:focus:border-brand-800";

const CloudUploadIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 18a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.62-1.3A4.5 4.5 0 0 1 17 18h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 12v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="m9 15 3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PERMISSION_ICONS = [TaskIcon, DollarLineIcon, BoxIconLine, PieChartIcon, PlugInIcon, DocsIcon, GroupIcon];

interface AddUserFormProps {
  onCancel: () => void;
  onCreated: () => void;
}

type AttachmentSlot = "commercial" | "national_id" | "other";

export default function AddUserForm({ onCancel, onCreated }: AddUserFormProps) {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    national_id: "",
    password: ""
  });

  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);

  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [assignedPermissionIds, setAssignedPermissionIds] = useState<number[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const [attachments, setAttachments] = useState<Partial<Record<AttachmentSlot, File>>>({});

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [createRoleForm, setCreateRoleForm] = useState(defaultCreateRoleForm);
  const [createRoleError, setCreateRoleError] = useState<string | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const response = await readRoles();
      if (response.status === 200 && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        setRoles([]);
      }
    } catch {
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSelectRole = useCallback(async (roleId: number) => {
    setSelectedRoleId(roleId);
    setPermissionsError(null);
    setPermissionsLoading(true);
    setAssignedPermissionIds([]);
    try {
      const [allRes, roleRes] = await Promise.all([readAllPermissions(), readPermissionOfRole(roleId)]);

      if (allRes.status === 200 && Array.isArray(allRes.data)) {
        const flattened = (allRes.data as PermissionsByModule[]).flatMap((m) => m.permissions);
        setAllPermissions(flattened.filter((p) => p.is_active));
      } else {
        setPermissionsError("فشل تحميل قائمة الصلاحيات");
      }

      const roleData = roleRes.data as RoleWithPermissions | undefined;
      const assignedIds = roleRes.status === 200 && roleData && Array.isArray(roleData.permissions) ? roleData.permissions.map((p) => p.permission_id) : [];
      setAssignedPermissionIds(assignedIds);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail : null;
      setPermissionsError(apiDetailToString(msg) || "فشل تحميل الصلاحيات");
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  const togglePermission = useCallback(
    async (permissionId: number) => {
      if (selectedRoleId == null) return;
      const currentlyAssigned = assignedPermissionIds.includes(permissionId);
      setPermissionsError(null);

      if (currentlyAssigned) {
        setAssignedPermissionIds((prev) => prev.filter((id) => id !== permissionId));
        try {
          await removePermissionFromRole(selectedRoleId, [permissionId]);
        } catch (err: unknown) {
          const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail : null;
          setPermissionsError(apiDetailToString(msg) || "فشل إزالة الصلاحية");
          setAssignedPermissionIds((prev) => [...prev, permissionId]);
        }
      } else {
        setAssignedPermissionIds((prev) => [...prev, permissionId]);
        try {
          const response = await assignPermissionToRole(selectedRoleId, [permissionId]);
          if (response.status !== 200) {
            throw new Error("failed");
          }
        } catch (err: unknown) {
          const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail : null;
          setPermissionsError(apiDetailToString(msg) || "فشل إسناد الصلاحية");
          setAssignedPermissionIds((prev) => prev.filter((id) => id !== permissionId));
        }
      }
    },
    [selectedRoleId, assignedPermissionIds]
  );

  const handleFileChange = (slot: AttachmentSlot, file: File | undefined) => {
    setAttachments((prev) => {
      const next = { ...prev };
      if (file) next[slot] = file;
      else delete next[slot];
      return next;
    });
  };

  const openCreateRoleModal = () => {
    setCreateRoleForm(defaultCreateRoleForm());
    setCreateRoleError(null);
    setIsCreateRoleOpen(true);
  };

  const closeCreateRoleModal = () => {
    if (!isCreatingRole) setIsCreateRoleOpen(false);
  };

  const handleCreateRole = async () => {
    const role_name_key = createRoleForm.role_name_key.trim();
    const translated_role_name = createRoleForm.translated_role_name.trim();
    if (!role_name_key || !translated_role_name) {
      setCreateRoleError("مطلوب: مفتاح الاسم والاسم المترجم");
      return;
    }
    setCreateRoleError(null);
    setIsCreatingRole(true);
    try {
      const body = {
        role_name_key,
        translations: [{ language_code: createRoleForm.language_code, translated_role_name }]
      };
      const response = await createNewRole(body);
      if (response.status === 200 || response.status === 201) {
        setIsCreateRoleOpen(false);
        await fetchRoles();
      } else {
        setCreateRoleError(
          apiDetailToString((response as { data?: { detail?: unknown } })?.data?.detail) || "فشل إنشاء الدور"
        );
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { detail?: unknown } } }).response?.data?.detail : null;
      setCreateRoleError(apiDetailToString(msg) || "فشل إنشاء الدور");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleSaveUser = async () => {
    const trimmedName = form.full_name.trim();
    if (!trimmedName || !form.phone.trim() || !form.password.trim()) {
      setSaveError("يرجى ملء الاسم ورقم الهاتف وكلمة المرور");
      return;
    }
    if (selectedRoleId == null) {
      setSaveError("يرجى اختيار دور للمستخدم");
      return;
    }

    const nameParts = trimmedName.split(/\s+/);
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(" ") || nameParts[0];
    const normalizedPhone = form.phone.replace(/\D/g, "");
    const phone_number = `+966${normalizedPhone}`;

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await createUser({
        phone_number,
        first_name,
        last_name,
        email: form.email.trim() || undefined,
        password: form.password,
        default_user_role_id: selectedRoleId,
        national_id: form.national_id.trim() || undefined,
        user_type_id: 1,
        account_status_id: 1,
        preferred_language_code: "ar"
      });

      if (response.status !== 200 && response.status !== 201) {
        const data = response.data as { detail?: unknown };
        setSaveError(apiDetailToString(data.detail) || "فشل في إنشاء المستخدم");
        return;
      }

      onCreated();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setSaveError(apiDetailToString(detail) || axiosError.message || "فشل في إنشاء المستخدم");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.role_id === selectedRoleId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-purple-500">إدارة المستخدمين / إضافة مستخدم جديد</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">إضافة مستخدم جديد</h1>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} disabled={isSaving} className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-700
          ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/5">
            إلغاء
          </button>
          <button type="button" onClick={handleSaveUser} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-medium
          text-white shadow-theme-xs transition hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 5a2 2 0 0 1 2-2h9l3 3v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M8 3v5h6V3M8 21v-6h8v6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            {isSaving ? "جاري الحفظ..." : "حفظ المستخدم"}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
            <div className="mb-6 flex items-center justify-end gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">المعلومات الشخصية</h2>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-500 dark:bg-purple-500/10">
                <UserCircleIcon className="h-5 w-5" />
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>الاسم الكامل</Label>
                <input type="text" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="أدخل اسم المستخدم الثلاثي" className={inputClass} />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <input type="email" dir="ltr" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="example@domain.com"
                className={`${inputClass} text-right`} />
              </div>

              <div>
                <Label>رقم الهوية / الإقامة</Label>
                <input type="text" value={form.national_id} onChange={(e) => setForm((p) => ({ ...p, national_id: e.target.value }))} placeholder="1XXXXXXXXX" className={inputClass} />
              </div>
              <div>
                <Label>رقم الهاتف</Label>
                <div className="flex items-center gap-2" dir="ltr">
                  <span className="flex h-11 items-center rounded-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800
                  dark:text-gray-300">
                    +966
                  </span>
                  <input type="tel" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="5XXXXXXXX" className={`${inputClass} text-right`} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label>كلمة المرور</Label>
                <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="أدخل كلمة المرور" className={inputClass} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
            <div className="mb-6 flex items-center justify-end gap-2">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">الأدوار</h2>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-500 dark:bg-purple-500/10">
                <GroupIcon className="h-5 w-5" />
              </span>
            </div>

            {rolesLoading ? (
              <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">جاري تحميل الأدوار...</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {roles.map((role, index) => {
                  const Icon = ROLE_ICONS[index % ROLE_ICONS.length];
                  const isSelected = selectedRoleId === role.role_id;
                  return (
                    <button type="button" key={role.role_id} onClick={() => handleSelectRole(role.role_id)}
                    className={`relative flex items-start justify-between gap-3 rounded-xl border p-4 text-right transition ${
                        isSelected
                          ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500 dark:bg-purple-500/10"
                          : "border-gray-200 bg-white hover:border-purple-300 dark:border-gray-700 dark:bg-white/3"
                      }`}
                    >
                      {isSelected && (
                        <CheckCircleIcon className="absolute left-3 top-3 h-5 w-5 text-purple-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white/90">{getArabicRoleName(role)}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{role.role_name_key}</p>
                      </div>
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                          isSelected
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                    </button>
                  );
                })}

                <button type="button" onClick={openCreateRoleModal} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-gray-300 p-4 text-right transition
                hover:border-purple-400 dark:border-gray-600">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 dark:text-white/90">إضافة دور آخر</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">تخصيص صلاحيات إضافية للمستخدم</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    <PlusIcon className="h-5 w-5" />
                  </span>
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
            <div className="mb-5 flex items-center justify-end gap-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">المرفقات المطلوبة</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-500 dark:bg-purple-500/10">
                <DocsIcon className="h-4 w-4" />
              </span>
            </div>

            <div className="space-y-4">
              {(
                [
                  { slot: "commercial", label: "السجل التجاري" },
                  { slot: "national_id", label: "الهوية الوطنية" },
                  { slot: "other", label: "مرفقات أخرى" },
                ] as { slot: AttachmentSlot; label: string }[]
              ).map(({ slot, label }) => (
                <div key={slot}>
                  <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-6 text-center transition
                  hover:border-purple-400 dark:border-gray-600">
                    <CloudUploadIcon className="h-7 w-7 text-purple-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      اضغط هنا للرفع أو اسحب الملفات هنا
                    </span>
                    <span className="text-[10px] text-gray-400">(PDF, JPG, PNG | Max 5MB)</span>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(slot, e.target.files?.[0])} />
                  </label>
                  {attachments[slot] && (
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800">
                      <button type="button" onClick={() => handleFileChange(slot, undefined)} className="text-gray-400 hover:text-error-500">
                        <TrashBinIcon className="h-4 w-4" />
                      </button>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                          {attachments[slot]!.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {Math.round(attachments[slot]!.size / 1024)} KB
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/3">
            <div className="mb-5 flex items-center justify-end gap-2">
              <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">الأدوار والصلاحيات</h2>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-50 text-purple-500 dark:bg-purple-500/10">
                <TaskIcon className="h-4 w-4" />
              </span>
            </div>

            {selectedRoleId == null ? (
              <p className="py-6 text-center text-xs text-gray-400">اختر دوراً لعرض صلاحياته</p>
            ) : permissionsLoading ? (
              <p className="py-6 text-center text-xs text-gray-400">جاري تحميل الصلاحيات...</p>
            ) : (
              <div className="space-y-1">
                {permissionsError && (
                  <p className="mb-2 text-xs text-error-500">{permissionsError}</p>
                )}
                <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                  {allPermissions.map((permission, index) => {
                    const Icon = PERMISSION_ICONS[index % PERMISSION_ICONS.length];
                    const checked = assignedPermissionIds.includes(permission.permission_id);
                    return (
                      <div key={permission.permission_id} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5">
                        <div className="flex flex-1 items-center justify-end gap-2 text-right">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
                              {permission.permission_name_key}
                            </p>
                            {permission.description && (
                              <p className="truncate text-[11px] text-gray-400">{permission.description}</p>
                            )}
                          </div>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            <Icon className="h-4 w-4" />
                          </span>
                        </div>
                        <button type="button" role="switch" aria-checked={checked} onClick={() => togglePermission(permission.permission_id)}
                          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                            checked ? "bg-purple-500" : "bg-gray-200 dark:bg-white/10"
                          }`}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm transition-all ${ checked ? "left-0.5" : "left-[calc(100%-1.375rem)]" }`} />
                        </button>
                      </div>
                    );
                  })}
                  {allPermissions.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-400">لا توجد صلاحيات متاحة</p>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl bg-linear-to-b from-purple-500 to-purple-700 p-6 text-white">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                <UserCircleIcon className="h-9 w-9 text-white" />
              </span>
              <div>
                <p className="text-lg font-semibold">{form.full_name.trim() || "معاينة الحساب"}</p>
                <p className="mt-1 text-xs text-white/70">يتم تحديث البيانات تلقائياً عند الإدخال</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 px-3 py-3 text-center">
                <p className="text-[11px] text-white/70">الحالة المبدئية</p>
                <p className="mt-1 text-xs font-medium">{selectedRole ? getArabicRoleName(selectedRole) : "—"}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-3 text-center">
                <p className="text-[11px] text-white/70">تاريخ الإنشاء</p>
                <p className="mt-1 text-xs font-medium">{formatArabicDate(new Date())}</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Modal isOpen={isCreateRoleOpen} onClose={closeCreateRoleModal} className="max-w-[520px] p-5 lg:p-10">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">إضافة دور جديد</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="role-name-key">
              مفتاح الاسم <span className="text-red-500">*</span>
            </Label>
            <input id="role-name-key" type="text" value={createRoleForm.role_name_key} onChange={(e) => {
              setCreateRoleForm((f) => ({ ...f, role_name_key: e.target.value }));
              if (createRoleError) setCreateRoleError(null);
              }} placeholder="مثال: USER" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700
              dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30" disabled={isCreatingRole} />
          </div>
          <div>
            <Label htmlFor="role-lang">اللغة</Label>
            <select id="role-lang" value={createRoleForm.language_code} onChange={(e) => setCreateRoleForm((f) => ({ ...f, language_code: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
              disabled={isCreatingRole}>
              {LANGUAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="role-translated-name">
              الاسم المترجم <span className="text-red-500">*</span>
            </Label>
            <input id="role-translated-name" type="text" value={createRoleForm.translated_role_name}
              onChange={(e) => {
                setCreateRoleForm((f) => ({ ...f, translated_role_name: e.target.value }));
                if (createRoleError) setCreateRoleError(null);
              }}
              placeholder="مثال: مستخدم أو user"
              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800
              dark:text-white/90 dark:placeholder:text-white/30"
              disabled={isCreatingRole}
            />
          </div>
        </div>
        {createRoleError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{createRoleError}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={closeCreateRoleModal} disabled={isCreatingRole}>
            إلغاء
          </Button>
          <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={handleCreateRole}
          disabled={isCreatingRole || !createRoleForm.role_name_key.trim() || !createRoleForm.translated_role_name.trim()}>
            {isCreatingRole ? "جاري الحفظ..." : "إنشاء الدور"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}