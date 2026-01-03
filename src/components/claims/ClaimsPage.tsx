"use client";
import { useState } from "react";
import { PencilIcon, MoreDotIcon, PaperPlaneIcon, PlusIcon } from "@/icons";
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

interface TimelineEvent {
  id: string;
  type: "created" | "assigned" | "note" | "status_change";
  title: string;
  date: string;
  author?: string;
  description?: string;
  note?: string;
}

interface Claim {
  id: string;
  claimId: string;
  customerName: string;
  sellerName: string;
  status: "بانتظار الرد" | "قيد المعالجة" | "تم تصعيدها" | "تم حلها";
  assignedTo?: string;
  claimOwner: string;
  claimant: string;
  claimType: string;
  amount: string;
  timeline: TimelineEvent[];
  documents?: string[];
  details?: string;
}

const mockClaims: Claim[] = [
  {
    id: "1",
    claimId: "#7C6A3D",
    customerName: "اسم العميل 1",
    sellerName: "اسم البائع 1",
    status: "بانتظار الرد",
    claimOwner: "اسم العميل 1",
    claimant: "اسم البائع 1",
    claimType: "لم يتم استلام المنتج",
    amount: "128.99 ريال",
    timeline: [
      {
        id: "1",
        type: "created",
        title: "تم انشاء المطالبة",
        date: "26 اكتوبر 2025, 9:51 صباحا",
        description: "المطالبة مقدمة من العميل للطلب #7C6A3D",
      },
    ],
  },
  {
    id: "2",
    claimId: "#8B5E2F",
    customerName: "اسم العميل 2",
    sellerName: "اسم البائع 2",
    status: "قيد المعالجة",
    assignedTo: "----",
    claimOwner: "اسم العميل 2",
    claimant: "اسم البائع 2",
    claimType: "لم يتم استلام المنتج",
    amount: "128.99 ريال",
    timeline: [
      {
        id: "1",
        type: "created",
        title: "تم انشاء المطالبة",
        date: "26 اكتوبر 2025, 9:51 صباحا",
        description: "المطالبة مقدمة من العميل للطلب #8B5E2F",
      },
      {
        id: "2",
        type: "assigned",
        title: "تم التعيين الى الموظف",
        date: "26 اكتوبر 2025, 9:58 صباحا",
      },
      {
        id: "3",
        type: "note",
        title: "تمت اضافة ملاحظة داخلية",
        date: "اسم البائع, 26 اكتوبر 2025, 11:02 صباحا",
        author: "اسم البائع",
        note: "قدم العميل تاكيد الشحن ولكن التتبع لم يتم تحديثه منذ 5 ايام . يتم التواصل مع البائع للحصول على التحديث.",
      },
    ],
  },
  {
    id: "3",
    claimId: "#9A4D1E",
    customerName: "اسم العميل 3",
    sellerName: "اسم البائع 3",
    status: "تم تصعيدها",
    claimOwner: "اسم العميل 3",
    claimant: "اسم البائع 3",
    claimType: "منتج تالف",
    amount: "250.00 ريال",
    timeline: [],
  },
  {
    id: "4",
    claimId: "#AB3C0D",
    customerName: "اسم العميل 4",
    sellerName: "اسم البائع 4",
    status: "تم حلها",
    claimOwner: "اسم العميل 4",
    claimant: "اسم البائع 4",
    claimType: "استرجاع",
    amount: "75.50 ريال",
    timeline: [],
  },
];

export default function ClaimsPage() {
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(mockClaims[1]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"timeline" | "documents" | "details">("timeline");
  const [noteText, setNoteText] = useState("");
  const itemsPerPage = 6;
  const totalItems = 100;

  const paginatedClaims = mockClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    status: Claim["status"]
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

  const getTimelineIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "created":
        return (
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "assigned":
        return (
          <svg
            className="w-5 h-5 text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
        );
      case "note":
        return (
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      ["معرف المطالبة", "اسم العميل", "اسم البائع", "الحالة"],
      ...mockClaims.map((claim) => [
        claim.claimId,
        claim.customerName,
        claim.sellerName,
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

  const handleSendNote = () => {
    if (!noteText.trim()) return;
    // Handle sending note
    console.log("Sending note:", noteText);
    setNoteText("");
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
                <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                  تغيير الحالة
                </Button>
                <Button size="sm" variant="outline">
                  تعيين
                </Button>
                <Button size="sm" variant="outline">
                  اغلاق المطالبة
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
                    صاحب المطالبة:
                  </span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {selectedClaim.claimOwner}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    المدعى عليه:
                  </span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {selectedClaim.claimant}
                  </p>
                </div>
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
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex gap-1 p-2">
                  {[
                    { id: "timeline", label: "الجدول الزمني" },
                    { id: "documents", label: "المستندات" },
                    { id: "details", label: "التفاصيل" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() =>
                        setActiveTab(tab.id as "timeline" | "documents" | "details")
                      }
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-purple-500 text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-5 sm:p-6">
                {activeTab === "timeline" && (
                  <div className="space-y-6">
                    {selectedClaim.timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                            {getTimelineIcon(event.type)}
                          </div>
                          {index < selectedClaim.timeline.length - 1 && (
                            <div className="mt-2 h-16 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="mb-1">
                            <h4 className="font-medium text-gray-800 dark:text-white/90">
                              {event.title}
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {event.date}
                            </p>
                          </div>
                          {event.description && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {event.description}
                            </p>
                          )}
                          {event.note && (
                            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {event.note}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>لا توجد مستندات مرفقة</p>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p>لا توجد تفاصيل إضافية</p>
                  </div>
                )}
              </div>

              {/* Note Input */}
              <div className="border-t border-gray-200 p-4 dark:border-gray-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendNote();
                      }
                    }}
                    placeholder="اضف ملاحظة داخلية او ارسل رسالة..."
                    className="flex-1 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  />
                  <button
                    onClick={handleSendNote}
                    className="flex items-center justify-center rounded-lg bg-purple-500 px-4 py-2.5 text-white transition-colors hover:bg-purple-600"
                  >
                    <PaperPlaneIcon className="w-5 h-5" />
                  </button>
                </div>
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

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button size="sm" className="w-full">
            <PlusIcon className="w-4 h-4 ml-2" />
            انشاء مطالبة
          </Button>
          <button
            onClick={handleExportReport}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            تصدير التقرير
          </button>
        </div>

        {/* Claims Table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
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
                    اسم العميل
                  </TableCell>
                  <TableCell
                    isHeader
                    className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    اسم البائع
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
                {paginatedClaims.map((claim) => (
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
                    <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {claim.customerName}
                    </TableCell>
                    <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {claim.sellerName}
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

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 pt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              عرض {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
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
              {[1, 2].map((page) => (
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
                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

