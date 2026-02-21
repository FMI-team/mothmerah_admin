"use client";

import { useCallback, useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { createNewRole, readRoles, removeRole } from "../../../services/roles";

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

const getArabicName = (role: ApiRole): string => {
  const ar = role.translations?.find((t) => t.language_code === "ar");
  return ar?.translated_role_name || role.role_name_key;
};

const LANGUAGE_OPTIONS = [
  { value: "ar", label: "العربية" },
  { value: "en", label: "English" }
];

const defaultCreateForm = () => ({
  role_name_key: "",
  language_code: "ar",
  translated_role_name: ""
});

const RolesComponent = () => {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 8;

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  const openCreateModal = () => {
    setCreateForm(defaultCreateForm());
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!isSubmitting) setIsCreateModalOpen(false);
  };

  const handleCreateRole = async () => {
    const role_name_key = createForm.role_name_key.trim();
    const translated_role_name = createForm.translated_role_name.trim();
    if (!role_name_key || !translated_role_name) {
      setCreateError("مطلوب: مفتاح الاسم والاسم المترجم");
      return;
    }
    setCreateError(null);
    setIsSubmitting(true);
    try {
      const body = {
        role_name_key,
        translations: [
          {
            language_code: createForm.language_code,
            translated_role_name
          }
        ]
      };
      const response = await createNewRole(body);
      if (response.status === 200 || response.status === 201) {
        closeCreateModal();
        fetchRoles();
      } else {
        setCreateError((response as { data?: { detail?: string } })?.data?.detail ?? "فشل إنشاء الدور");
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      setCreateError(msg ?? "فشل إنشاء الدور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (role_id: number) => {
    try {
      const response = await removeRole(role_id);
      if (response.status === 200 || response.status === 204) {
        fetchRoles();
      } else {
        setCreateError((response as { data?: { detail?: string } })?.data?.detail ?? "فشل حذف الدور");
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : null;
      setCreateError(msg ?? "فشل حذف الدور");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const paginatedRoles = roles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalItems = roles.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const totalRoles = roles.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">إدارة الأدوار</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">عرض وإدارة أدوار المستخدمين في النظام</p>
        </div>
        <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={openCreateModal}>إضافة دور جديد</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">إجمالي الأدوار</p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">{totalRoles.toLocaleString("ar-SA")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">جاري تحميل الأدوار...</div>
        ) : roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <p className="text-sm text-gray-500 dark:text-gray-400">لا توجد أدوار لعرضها</p>
          </div>
        ) : (
          <>
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                  <TableRow>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">المعرف</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">مفتاح الاسم</TableCell>
                    <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الاسم (عربي)</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedRoles.map((role) => (
                    <TableRow key={role.role_id}>
                      <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">{role.role_id}</TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">{role.role_name_key}</TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">{getArabicName(role)}</TableCell>
                      <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                        <Button size="sm" variant="outline" onClick={() => handleRemoveRole(role.role_id)}>حذف</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalItems > 0 && (
              <div className="flex items-center justify-between gap-4 pt-6">
                <div className="text-sm text-gray-500 dark:text-gray-400">عرض{" "}
                  {Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    totalItems
                  )}-{Math.min(currentPage * itemsPerPage, totalItems)} من{" "}
                  {totalItems}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="h-10 rounded-lg border border-gray-200 bg-white
                  px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800
                  dark:text-gray-300 dark:hover:bg-gray-700">
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).filter(
                      (p) => p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)
                    ).map((page) => (
                      <button key={page} type="button" onClick={() => setCurrentPage(page)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          currentPage === page
                            ? "bg-purple-500 text-white"
                            : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  <button type="button" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages} className="h-10 rounded-lg border
                  border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700
                  dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
                    التالي
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} className="max-w-[520px] p-5 lg:p-10">
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">إضافة دور جديد</h4>
        <div className="space-y-4">
          <div>
            <Label htmlFor="role-name-key">مفتاح الاسم <span className="text-red-500">*</span></Label>
            <input id="role-name-key" type="text" value={createForm.role_name_key} onChange={(e) => {
                setCreateForm((f) => ({ ...f, role_name_key: e.target.value }));
                if (createError) setCreateError(null);
              }} placeholder="مثال: USER" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400
              dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30" disabled={isSubmitting}
            />
          </div>
          <div>
            <Label htmlFor="role-lang">اللغة</Label>
            <select id="role-lang" value={createForm.language_code} onChange={(e) => setCreateForm((f) => ({ ...f, language_code: e.target.value }))} className="mt-1 w-full rounded-lg border
            border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" disabled={isSubmitting}>
              {LANGUAGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="role-translated-name">الاسم المترجم <span className="text-red-500">*</span></Label>
            <input id="role-translated-name" type="text" value={createForm.translated_role_name} onChange={(e) => {
                setCreateForm((f) => ({ ...f, translated_role_name: e.target.value }));
                if (createError) setCreateError(null);
              }} placeholder="مثال: مستخدم أو user" className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400
              dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30" disabled={isSubmitting}
            />
          </div>
        </div>
        {createError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">{createError}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button size="sm" variant="outline" onClick={closeCreateModal} disabled={isSubmitting}>إلغاء</Button>
          <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={handleCreateRole}
          disabled={isSubmitting || !createForm.role_name_key.trim() || !createForm.translated_role_name.trim()}>
            {isSubmitting ? "جاري الحفظ..." : "إنشاء الدور"}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RolesComponent;