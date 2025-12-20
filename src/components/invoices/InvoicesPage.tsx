"use client";
import React, { useState } from "react";
import { DownloadIcon, PencilIcon, MoreDotIcon } from "@/icons";
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

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  amount: string;
  status: "مدفوعة" | "قيد الانتظار" | "متأخرة";
  issueDate: string;
  dueDate: string;
  items: {
    name: string;
    quantity: string;
    price: string;
  }[];
  subtotal: string;
  tax: string;
  total: string;
  payments: Array<{
    date: string;
    amount: string;
    method: string;
  }>;
}

const mockInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNumber: "#INV-2024-001",
    clientName: "اسم العميل 1",
    amount: "1,200.50 ريال",
    status: "قيد الانتظار",
    issueDate: "18 يوليو 2024",
    dueDate: "17 نوفمبر 2024",
    items: [
      { name: "5 كيلو بطاطس طازجة", quantity: "5", price: "1,560 ريال" },
      { name: "2 كيلو مانجو عضوية", quantity: "2", price: "120.00 ريال" },
    ],
    subtotal: "1,680 ريال",
    tax: "120.00 ريال",
    total: "1,800 ريال",
    payments: [],
  },
  {
    id: "2",
    invoiceNumber: "#INV-2024-002",
    clientName: "اسم العميل 2",
    amount: "1,200.50 ريال",
    status: "قيد الانتظار",
    issueDate: "18 يوليو 2024",
    dueDate: "17 نوفمبر 2024",
    items: [
      { name: "5 كيلو بطاطس طازجة", quantity: "5", price: "1,560 ريال" },
      { name: "2 كيلو مانجو عضوية", quantity: "2", price: "120.00 ريال" },
    ],
    subtotal: "1,680 ريال",
    tax: "120.00 ريال",
    total: "1,800 ريال",
    payments: [],
  },
  {
    id: "3",
    invoiceNumber: "#INV-2024-003",
    clientName: "اسم العميل 3",
    amount: "1,200.50 ريال",
    status: "متأخرة",
    issueDate: "18 يوليو 2024",
    dueDate: "17 نوفمبر 2024",
    items: [
      { name: "5 كيلو بطاطس طازجة", quantity: "5", price: "1,560 ريال" },
      { name: "2 كيلو مانجو عضوية", quantity: "2", price: "120.00 ريال" },
    ],
    subtotal: "1,680 ريال",
    tax: "120.00 ريال",
    total: "1,800 ريال",
    payments: [],
  },
  {
    id: "4",
    invoiceNumber: "#INV-2024-004",
    clientName: "اسم العميل 4",
    amount: "1,200.50 ريال",
    status: "مدفوعة",
    issueDate: "18 يوليو 2024",
    dueDate: "17 نوفمبر 2024",
    items: [
      { name: "5 كيلو بطاطس طازجة", quantity: "5", price: "1,560 ريال" },
      { name: "2 كيلو مانجو عضوية", quantity: "2", price: "120.00 ريال" },
    ],
    subtotal: "1,680 ريال",
    tax: "120.00 ريال",
    total: "1,800 ريال",
    payments: [
      { date: "20 يوليو 2024", amount: "1,800 ريال", method: "تحويل بنكي" },
    ],
  },
];

export default function InvoicesPage() {
  const [selectedStatus, setSelectedStatus] = useState("الكل");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(
    mockInvoices[1]
  );
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const totalItems = 100;

  const filteredInvoices =
    selectedStatus === "الكل"
      ? mockInvoices
      : mockInvoices.filter((inv) => inv.status === selectedStatus);

  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId)
        ? prev.filter((id) => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.length === paginatedInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(paginatedInvoices.map((inv) => inv.id));
    }
  };

  const getStatusBadgeColor = (
    status: Invoice["status"]
  ): "success" | "warning" | "error" => {
    switch (status) {
      case "مدفوعة":
        return "success";
      case "قيد الانتظار":
        return "warning";
      case "متأخرة":
        return "error";
      default:
        return "warning";
    }
  };

  const handleExportReport = () => {
    const csvContent = [
      ["رقم الفاتورة", "اسم العميل", "المبلغ", "الحالة"],
      ...filteredInvoices.map((inv) => [
        inv.invoiceNumber,
        inv.clientName,
        inv.amount,
        inv.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `invoices_report_${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkAsPaid = () => {
    if (selectedInvoice) {
      // Update invoice status
      const updatedInvoice = { ...selectedInvoice, status: "مدفوعة" as const };
      setSelectedInvoice(updatedInvoice);
    }
  };

  const handleSendReminder = () => {
    // Send reminder logic
    alert("تم ارسال التذكير بنجاح");
  };

  const handleDownloadPDF = () => {
    // PDF download logic
    alert("جاري تحميل PDF...");
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Section - Invoice List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            ادارة الفواتير
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            مرحبا بعودتك اليك نظرة عامة على السوق
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {["الكل", "مدفوعة", "قيد الانتظار", "متأخرة"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
          <div className="flex-1"></div>
          <button
            onClick={handleExportReport}
            className="whitespace-nowrap rounded-lg bg-purple-100 px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
          >
            تصدير التقرير
          </button>
        </div>

        {/* Invoice Table */}
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
                          paginatedInvoices.length > 0 &&
                          selectedInvoices.length === paginatedInvoices.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                      رقم الفاتورة
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
                    المبلغ
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
                {paginatedInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className={`cursor-pointer transition-colors ${
                      selectedInvoice?.id === invoice.id
                        ? "bg-purple-50 dark:bg-purple-900/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => setSelectedInvoice(invoice)}
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleInvoiceSelection(invoice.id);
                          }}
                          className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                        />
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {invoice.clientName}
                    </TableCell>
                    <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90">
                      {invoice.amount}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={getStatusBadgeColor(invoice.status)}>
                        {invoice.status}
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
                                actionDropdownOpen === invoice.id
                                  ? null
                                  : invoice.id
                              )
                            }
                            className="p-1.5 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                          >
                            <MoreDotIcon className="w-5 h-5" />
                          </button>
                          <Dropdown
                            isOpen={actionDropdownOpen === invoice.id}
                            onClose={() => setActionDropdownOpen(null)}
                            className="absolute left-0 mt-2 w-40 p-2 z-50"
                          >
                            <DropdownItem
                              onItemClick={() => {
                                setActionDropdownOpen(null);
                                setSelectedInvoice(invoice);
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
                            setSelectedInvoice(invoice);
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

      {/* Right Section - Invoice Details */}
      <div className="lg:col-span-1">
        {selectedInvoice ? (
          <div className="sticky top-6 space-y-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  تفاصيل الفاتورة
                </h2>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedInvoice.invoiceNumber}
                </span>
                <Badge size="sm" color={getStatusBadgeColor(selectedInvoice.status)}>
                  {selectedInvoice.status}
                </Badge>
              </div>
            </div>

            {/* General Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                المعلومات العامة
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">الحالة:</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">العميل:</span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.clientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    تاريخ الاصدار:
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.issueDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    تاريخ الاستحقاق:
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.dueDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                البنود
              </h3>
              <div className="space-y-2">
                {selectedInvoice.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between text-sm border-b border-gray-100 pb-2 dark:border-gray-800"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                    <span className="font-medium text-gray-800 dark:text-white/90">
                      {item.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  المجموع الفرعي:
                </span>
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {selectedInvoice.subtotal}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  ضريبة (8%):
                </span>
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {selectedInvoice.tax}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-base font-semibold text-gray-800 dark:text-white/90">
                  المبلغ الاجمالي:
                </span>
                <span className="text-lg font-bold text-gray-800 dark:text-white/90">
                  {selectedInvoice.total}
                </span>
              </div>
            </div>

            {/* Payment Record */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                سجل الدفع
              </h3>
              {selectedInvoice.payments.length > 0 ? (
                <div className="space-y-2">
                  {selectedInvoice.payments.map((payment, index) => (
                    <div
                      key={index}
                      className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {payment.date}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {payment.amount}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.method}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  لم يتم تسجيل اي مدفوعات حتى الان
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
              <Button
                size="sm"
                className="w-full"
                onClick={handleMarkAsPaid}
                disabled={selectedInvoice.status === "مدفوعة"}
              >
                وضع علامة كمدفوعة
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleSendReminder}
              >
                ارسال تذكير
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleDownloadPDF}
              >
                تنزيل PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="sticky top-6 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              اختر فاتورة لعرض التفاصيل
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

