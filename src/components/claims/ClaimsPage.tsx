"use client";
import { useState, useEffect, useCallback } from "react";
import { PencilIcon, MoreDotIcon, PaperPlaneIcon } from "@/icons";
import Badge from "../ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import { getAuthHeader } from "@/lib/auth";

interface ApiClaim {
  gg_claim_id: number;
  related_order_id: string;
  problem_description: string;
  claimed_quantity_description: string;
  gg_claim_status_id: number;
  created_at: string;
  items: unknown[];
  evidences: unknown[];
}

interface TimelineEvent {
  id: string;
  type: "created" | "assigned" | "note" | "status_change";
  title: string;
  date: string;
  author?: string;
  description?: string;
  note?: string;
}

type ClaimStatus = "بانتظار الرد" | "قيد المعالجة" | "تم تصعيدها" | "تم حلها";

interface Claim {
  id: string;
  claimId: string;
  status: ClaimStatus;
  assignedTo?: string;
  claimType: string;
  amount: string;
  timeline: TimelineEvent[];
  documents?: string[];
  details?: string;
  raw?: ApiClaim;
}

const API_BASE = "http://127.0.0.1:8000";

const CLAIM_STATUS_LABELS: Record<number, ClaimStatus> = {
  1: "بانتظار الرد",
  2: "قيد المعالجة",
  3: "تم تصعيدها",
  4: "تم حلها",
};

const CLAIM_STATUS_KEYS = [
  { key: "SUBMITTED", label: "بانتظار الرد" },
  { key: "UNDER_REVIEW", label: "قيد المعالجة" },
  { key: "RESOLVED", label: "تم تصعيدها" },
  { key: "CLOSED", label: "تم حلها" },
] as const;

function parseApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const b = body as { message?: string; detail?: string | { loc?: unknown[]; msg: string; type?: string }[] };
  if (typeof b.message === "string" && b.message) return b.message;
  const d = b.detail;
  if (typeof d === "string" && d) return d;
  if (Array.isArray(d) && d.length > 0) {
    const messages = d
      .map((item) => (item && typeof item === "object" && "msg" in item ? item.msg : null))
      .filter((m): m is string => typeof m === "string");
    if (messages.length > 0) return messages.join(" — ");
  }
  return fallback;
}

function formatClaimDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("ar-SA", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}


function mapApiClaimToClaim(api: ApiClaim): Claim {
  const status: ClaimStatus =
    CLAIM_STATUS_LABELS[api.gg_claim_status_id] ?? "بانتظار الرد";
  const createdDate = formatClaimDate(api.created_at);
  const timeline: TimelineEvent[] = [
    {
      id: "created",
      type: "created",
      title: "تم انشاء المطالبة",
      date: createdDate,
      description: `المطالبة مقدمة من العميل للطلب ${api.related_order_id}`,
    },
  ];
  const documents: string[] = Array.isArray(api.evidences)
    ? (api.evidences as { url?: string; file_name?: string }[])
        .map((e) => e?.url || e?.file_name)
        .filter(Boolean) as string[]
    : [];

  return {
    id: String(api.gg_claim_id),
    claimId: api.related_order_id,
    status,
    claimType: api.problem_description,
    amount: api.claimed_quantity_description || "—",
    timeline,
    documents: documents.length ? documents : undefined,
    raw: api,
  };
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | "">("");
  const [noteText, setNoteText] = useState("");
  const [commentVisibility, setCommentVisibility] = useState<"INTERNAL" | "BOTH_PARTIES">("INTERNAL");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatusKey, setNewStatusKey] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<"APPROVED" | "REJECTED" | "PARTIAL" | "REQUEST_INFO">("APPROVED");
  const [decisionJustification, setDecisionJustification] = useState("");
  const [decisionRefundAmount, setDecisionRefundAmount] = useState<number>(0);
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const itemsPerPage = 6;
  const totalItems = claims.length;

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeader();
      const url = statusFilter
        ? `${API_BASE}/admin/guarantees/claims/status/${encodeURIComponent(statusFilter)}`
        : `${API_BASE}/admin/guarantees/claims`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...headers },
      });
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(parseApiError(errBody, "فشل تحميل المطالبات"));
      }
      const data: ApiClaim[] = await response.json();
      setClaims((data || []).map(mapApiClaimToClaim));
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تحميل المطالبات");
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
    fetchClaims();
  }, [fetchClaims]);

  const paginatedClaims = claims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.max(1, Math.ceil(claims.length / itemsPerPage));

  const toggleClaimSelection = (claimId: string) => {
    setSelectedClaims((prev) =>
      prev.includes(claimId)
        ? prev.filter((id) => id !== claimId)
        : [...prev, claimId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClaims.length === paginatedClaims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(paginatedClaims.map((claim) => claim.id));
    }
  };

  const getStatusBadgeColor = (
    status: ClaimStatus
  ): "success" | "warning" | "error" | "info" | "primary" => {
    switch (status) {
      case "تم حلها":
        return "success";
      case "بانتظار الرد":
        return "warning";
      case "تم تصعيدها":
        return "error";
      case "قيد المعالجة":
        return "info";
      default:
        return "warning";
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      ["معرف المطالبة", "الحالة"],
      ...claims.map((claim) => [
        claim.claimId,
        claim.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `claims_report_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openStatusModal = () => {
    if (!selectedClaim) return;
    const currentKey = CLAIM_STATUS_KEYS.find((s) => s.label === selectedClaim.status)?.key ?? "";
    setNewStatusKey(currentKey);
    setStatusReason("");
    setStatusUpdateError(null);
    setStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setNewStatusKey("");
    setStatusReason("");
    setStatusUpdateError(null);
  };

  const openDecisionModal = () => {
    if (!selectedClaim) return;
    setDecisionType("APPROVED");
    setDecisionJustification("");
    setDecisionRefundAmount(0);
    setDecisionError(null);
    setDecisionModalOpen(true);
  };

  const closeDecisionModal = () => {
    setDecisionModalOpen(false);
    setDecisionJustification("");
    setDecisionRefundAmount(0);
    setDecisionError(null);
  };

  const handleSubmitDecision = async () => {
    if (!selectedClaim) return;
    setDecisionError(null);
    setDecisionSubmitting(true);
    try {
      const headers = getAuthHeader();
      const response = await fetch(
        `${API_BASE}/admin/guarantees/claims/${encodeURIComponent(selectedClaim.id)}/decision`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            decision_type: decisionType,
            justification: decisionJustification.trim(),
            refund_amount: decisionRefundAmount,
          }),
        }
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(parseApiError(errBody, "فشل إرسال القرار"));
      }
      closeDecisionModal();
    } catch (err) {
      setDecisionError(err instanceof Error ? err.message : "فشل إرسال القرار");
    } finally {
      setDecisionSubmitting(false);
    }
  };

  const handleUpdateClaimStatus = async () => {
    if (!selectedClaim || !newStatusKey.trim()) return;
    setStatusUpdateError(null);
    setStatusUpdating(true);
    try {
      const headers = getAuthHeader();
      const params = new URLSearchParams({ status_key: newStatusKey });
      if (statusReason.trim()) params.set("reason", statusReason.trim());
      const response = await fetch(
        `${API_BASE}/admin/guarantees/claims/${encodeURIComponent(selectedClaim.id)}/status?${params.toString()}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...headers },
        }
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(parseApiError(errBody, "فشل تحديث الحالة"));
      }
      const newLabel = CLAIM_STATUS_KEYS.find((s) => s.key === newStatusKey)?.label ?? selectedClaim.status;
      setSelectedClaim({ ...selectedClaim, status: newLabel as ClaimStatus });
      setClaims((prev) =>
        prev.map((c) =>
          c.id === selectedClaim.id ? { ...c, status: newLabel as ClaimStatus } : c
        )
      );
      closeStatusModal();
    } catch (err) {
      setStatusUpdateError(err instanceof Error ? err.message : "فشل تحديث الحالة");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleSendNote = async () => {
    if (!selectedClaim || !noteText.trim()) return;
    setCommentError(null);
    setCommentSubmitting(true);
    try {
      const headers = getAuthHeader();
      const response = await fetch(
        `${API_BASE}/admin/guarantees/claims/${encodeURIComponent(selectedClaim.id)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            comment: noteText.trim(),
            visibility: commentVisibility,
          }),
        }
      );
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(parseApiError(errBody, "فشل إرسال التعليق"));
      }
      setNoteText("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "فشل إرسال التعليق");
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Section - Claim Details */}
      <div className="lg:col-span-2">
        {selectedClaim ? (
          <div className="space-y-6">
            {/* Claim Header */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    المطالبة {selectedClaim.claimId}
                  </h2>
                  <Badge size="sm" color={getStatusBadgeColor(selectedClaim.status)}>
                    {selectedClaim.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  معينة الى الموظف {selectedClaim.assignedTo || "----"}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  className="bg-purple-500 hover:bg-purple-600"
                  onClick={openStatusModal}
                >
                  تغيير الحالة
                </Button>
                <Button size="sm" variant="outline">
                  تعيين
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openDecisionModal}
                >
                  إرسال القرار النهائي
                </Button>
              </div>
            </div>

            {/* Summary Section */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                ملخص
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    نوع المطالبة:
                  </span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {selectedClaim.claimType}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    المبلغ:
                  </span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {selectedClaim.amount}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs and Content */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">

              {/* Tab Content */}
              <div className="p-5 sm:p-6">

              <div className="space-y-4 text-sm">
                    {selectedClaim.raw ? (
                      <>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">معرف الطلب: </span>
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {selectedClaim.raw.related_order_id}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">تاريخ الإنشاء: </span>
                          <span className="font-medium text-gray-800 dark:text-white/90">
                            {formatClaimDate(selectedClaim.raw.created_at)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">وصف المشكلة: </span>
                          <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                            {selectedClaim.raw.problem_description}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">وصف الكمية المطلوبة: </span>
                          <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                            {selectedClaim.raw.claimed_quantity_description || "—"}
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400">
                        لا توجد تفاصيل إضافية
                      </p>
                    )}
                  </div>
              </div>

              <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                <div className="mb-2 flex gap-2">
                  <label htmlFor="comment-visibility" className="sr-only">
                    ظهور التعليق
                  </label>
                  <select
                    id="comment-visibility"
                    value={commentVisibility}
                    onChange={(e) =>
                      setCommentVisibility(e.target.value as "INTERNAL" | "BOTH_PARTIES")
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  >
                    <option value="INTERNAL">داخلي فقط</option>
                    <option value="BOTH_PARTIES">للطرفين</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => {
                      setNoteText(e.target.value);
                      if (commentError) setCommentError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendNote();
                      }
                    }}
                    placeholder="اضف ملاحظة داخلية او ارسل رسالة..."
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    disabled={commentSubmitting}
                  />
                  <button
                    type="button"
                    onClick={handleSendNote}
                    disabled={commentSubmitting || !noteText.trim()}
                    className="flex items-center justify-center rounded-lg bg-purple-500 px-4 py-2.5 text-white transition-colors hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperPlaneIcon className="w-5 h-5" />
                  </button>
                </div>
                {commentError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{commentError}</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              اختر مطالبة لعرض التفاصيل
            </p>
          </div>
        )}
      </div>

      {/* Right Section - Claims List */}
      <div className="lg:col-span-1 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            ادارة المطالبات
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            مراجعة وتعيين ومعالجة المطالبات
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleExportReport}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            تصدير التقرير
          </button>
        </div>

        <div>
          <label htmlFor="claim-status-filter" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            تصفية حسب الحالة
          </label>
          <select
            id="claim-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
          >
            <option value="">الكل</option>
            {CLAIM_STATUS_KEYS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
          {loading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              جاري تحميل المطالبات...
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => fetchClaims()}
              >
                إعادة المحاولة
              </Button>
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
                          paginatedClaims.length > 0 &&
                          selectedClaims.length === paginatedClaims.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                      معرف المطالبة
                    </div>
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
                {paginatedClaims.length === 0 ? (
                  <TableRow>
                    <td colSpan={3} className="py-12 text-center text-gray-500 dark:text-gray-400">
                      لا توجد مطالبات
                    </td>
                  </TableRow>
                ) : paginatedClaims.map((claim) => (
                  <TableRow
                    key={claim.id}
                    className={`cursor-pointer transition-colors ${
                      selectedClaim?.id === claim.id
                        ? "bg-purple-50 dark:bg-purple-900/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => setSelectedClaim(claim)}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedClaims.includes(claim.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleClaimSelection(claim.id);
                          }}
                          className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {claim.claimId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={getStatusBadgeColor(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActionDropdownOpen(
                                actionDropdownOpen === claim.id
                                  ? null
                                  : claim.id
                              )
                            }
                            className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            <MoreDotIcon className="w-5 h-5" />
                          </button>
                          <Dropdown
                            isOpen={actionDropdownOpen === claim.id}
                            onClose={() => setActionDropdownOpen(null)}
                            className="absolute left-0 mt-2 w-40 p-2 z-50"
                          >
                            <DropdownItem
                              onItemClick={() => {
                                setActionDropdownOpen(null);
                                setSelectedClaim(claim);
                              }}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              عرض التفاصيل
                            </DropdownItem>
                            <DropdownItem
                              onItemClick={() => {
                                setActionDropdownOpen(null);
                              }}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                            >
                              تعديل
                            </DropdownItem>
                            <DropdownItem
                              onItemClick={() => {
                                setActionDropdownOpen(null);
                              }}
                              className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                            >
                              حذف
                            </DropdownItem>
                          </Dropdown>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClaim(claim);
                          }}
                          className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!loading && !error && claims.length > 0 && (
          <div className="flex items-center justify-between gap-4 pt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              عرض {totalItems === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
              {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                السابق
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-purple-500 text-white"
                      : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                التالي
              </button>
            </div>
          </div>
          )}
          </>
          )}
        </div>
      </div>

      <Modal
        isOpen={statusModalOpen}
        onClose={closeStatusModal}
        className="max-w-[500px] p-5 lg:p-10"
      >
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          تغيير الحالة
        </h4>
        {selectedClaim && (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              المطالبة {selectedClaim.claimId} — الحالة الحالية: {selectedClaim.status}
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="claim-new-status">
                  الحالة الجديدة <span className="text-red-500">*</span>
                </Label>
                <select
                  id="claim-new-status"
                  value={newStatusKey}
                  onChange={(e) => setNewStatusKey(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                >
                  <option value="">اختر الحالة</option>
                  {CLAIM_STATUS_KEYS.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="claim-status-reason">السبب (اختياري)</Label>
                <textarea
                  id="claim-status-reason"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="سبب تغيير الحالة..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>
            </div>
            {statusUpdateError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{statusUpdateError}</p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <Button size="sm" variant="outline" onClick={closeStatusModal} disabled={statusUpdating}>
                إلغاء
              </Button>
              <Button
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                onClick={handleUpdateClaimStatus}
                disabled={!newStatusKey.trim() || statusUpdating}
              >
                {statusUpdating ? "جاري التحديث..." : "تحديث الحالة"}
              </Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        isOpen={decisionModalOpen}
        onClose={closeDecisionModal}
        className="max-w-[500px] p-5 lg:p-10"
      >
        <h4 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          إرسال القرار النهائي
        </h4>
        {selectedClaim && (
          <>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              المطالبة {selectedClaim.claimId}
            </p>
            <div className="space-y-4">
              <div>
                <Label htmlFor="decision-type">
                  نوع القرار <span className="text-red-500">*</span>
                </Label>
                <select
                  id="decision-type"
                  value={decisionType}
                  onChange={(e) =>
                    setDecisionType(e.target.value as "APPROVED" | "REJECTED" | "PARTIAL" | "REQUEST_INFO")
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                >
                  <option value="APPROVED">موافق (APPROVED)</option>
                  <option value="REJECTED">مرفوض (REJECTED)</option>
                  <option value="PARTIAL">جزئي (PARTIAL)</option>
                  <option value="REQUEST_INFO">طلب معلومات (REQUEST_INFO)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="decision-justification">التبرير</Label>
                <textarea
                  id="decision-justification"
                  value={decisionJustification}
                  onChange={(e) => setDecisionJustification(e.target.value)}
                  placeholder="تبرير القرار..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30"
                />
              </div>
              <div>
                <Label htmlFor="decision-refund">مبلغ الاسترداد</Label>
                <input
                  id="decision-refund"
                  type="number"
                  min={0}
                  step={0.01}
                  value={decisionRefundAmount}
                  onChange={(e) => setDecisionRefundAmount(Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                />
              </div>
            </div>
            {decisionError && (
              <p className="mt-3 text-sm text-red-600 dark:text-red-400">{decisionError}</p>
            )}
            <div className="mt-6 flex gap-3 justify-end">
              <Button size="sm" variant="outline" onClick={closeDecisionModal} disabled={decisionSubmitting}>
                إلغاء
              </Button>
              <Button
                size="sm"
                className="bg-purple-500 hover:bg-purple-600"
                onClick={handleSubmitDecision}
                disabled={decisionSubmitting}
              >
                {decisionSubmitting ? "جاري الإرسال..." : "إرسال القرار"}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

