"use client";
import { useState, useEffect, useCallback } from "react";
import { PencilIcon, MoreDotIcon } from "@/icons";
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

interface MoyasarInvoice {
  id: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  amount_format: string;
  url: string;
  callback_url: string | null;
  expired_at: string;
  created_at: string;
  updated_at: string;
  back_url: string | null;
  success_url: string | null;
  payment_id: string | null;
  paid_at: string | null;
  metadata: unknown | null;
}

interface MoyasarResponse {
  invoices: MoyasarInvoice[];
  meta: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    total_count: number;
  };
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
};

const mapMoyasarStatusToInvoiceStatus = (status: string): "مدفوعة" | "قيد الانتظار" | "متأخرة" => {
  switch (status.toLowerCase()) {
    case "paid":
      return "مدفوعة";
    case "failed":
    case "expired":
      return "متأخرة";
    case "initiated":
    case "pending":
    default:
      return "قيد الانتظار";
  }
};

const mapMoyasarInvoiceToInvoice = (moyasarInvoice: MoyasarInvoice): Invoice => {
  const amountInSAR = moyasarInvoice.amount / 100; // Convert from halalas to SAR
  const subtotal = amountInSAR * 0.92; // Assuming 8% tax
  const tax = amountInSAR * 0.08;
  
  return {
    id: moyasarInvoice.id,
    invoiceNumber: `#INV-${moyasarInvoice.id.substring(0, 8).toUpperCase()}`,
    clientName: moyasarInvoice.metadata && typeof moyasarInvoice.metadata === 'object' && moyasarInvoice.metadata !== null
      ? (moyasarInvoice.metadata as { client_name?: string }).client_name || "عميل"
      : "عميل",
    amount: `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}`,
    status: mapMoyasarStatusToInvoiceStatus(moyasarInvoice.status),
    issueDate: formatDate(moyasarInvoice.created_at),
    dueDate: formatDate(moyasarInvoice.expired_at),
    items: moyasarInvoice.description
      ? [{ name: moyasarInvoice.description, quantity: "1", price: `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}` }]
      : [{ name: "فاتورة", quantity: "1", price: `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}` }],
    subtotal: `${subtotal.toFixed(2)} ${moyasarInvoice.currency}`,
    tax: `${tax.toFixed(2)} ${moyasarInvoice.currency}`,
    total: moyasarInvoice.amount_format || `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}`,
    payments: moyasarInvoice.paid_at
      ? [{ date: formatDate(moyasarInvoice.paid_at), amount: moyasarInvoice.amount_format || `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}`, method: "بطاقة ائتمانية" }]
      : [],
  };
};

const MOYASAR_API_KEY = "sk_test_8zMhNR3zp77KvSjxPQMweWy3ZjFXtFP1cwiCx7oV";
const MOYASAR_API_SECRET = "@Wmnkdr123";

export default function BaseUserInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("الكل");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 4;

  const fetchInvoices = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const credentials = btoa(`${MOYASAR_API_KEY}:${MOYASAR_API_SECRET}`);
      
      const response = await fetch(`https://api.moyasar.com/v1/invoices?page=${page}`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("فشل في جلب الفواتير من Moyasar");
      }

      const data: MoyasarResponse = await response.json();
      
      // Map Moyasar invoices to our Invoice format
      const mappedInvoices = data.invoices.map(mapMoyasarInvoiceToInvoice);
      setInvoices(mappedInvoices);
      setTotalPages(data.meta.total_pages);
      setTotalItems(data.meta.total_count);
      
      // Set first invoice as selected if available
      if (mappedInvoices.length > 0 && !selectedInvoice) {
        setSelectedInvoice(mappedInvoices[0]);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ في جلب بيانات الفواتير"
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedInvoice]);

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, fetchInvoices]);

  const filteredInvoices =
    selectedStatus === "الكل"
      ? invoices
      : invoices.filter((inv) => inv.status === selectedStatus);

  const paginatedInvoices = filteredInvoices;

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
      // Update in invoices state
      setInvoices((prev) =>
        prev.map((inv: Invoice) =>
          inv.id === selectedInvoice.id ? updatedInvoice : inv
        )
      );
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

  if (isLoading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  if (error && invoices.length === 0) {
    return (
      <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Section - Invoice List */}
      <div className="lg:col-span-2 order-1 lg:order-1">
        {/* Welcome Message */}
        <div className="mb-6">
          <p className="text-gray-500 dark:text-gray-400">
            مرحبا بعودتك إليك نظرة عامة على السوق
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportReport}
          className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          تصدير التقرير
        </button>

        {/* Filter Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {["الكل", "مدفوعة", "قيد الانتظار", "متأخرة"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatus(status);
                setCurrentPage(1);
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                selectedStatus === status
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {status}
            </button>
          ))}
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                عرض {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
                {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  السابق
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      disabled={isLoading}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-purple-500 text-white"
                          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages || isLoading}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-1 order-2 lg:order-2">
        {selectedInvoice ? (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  تفاصيل الفاتورة
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedInvoice.invoiceNumber}
                </p>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <Badge size="sm" color={getStatusBadgeColor(selectedInvoice.status)}>
                  {selectedInvoice.status}
                </Badge>
              </div>

              {/* Customer Information */}
              <div className="mb-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    العميل
                  </span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.clientName}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    تاريخ الاصدار
                  </span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.issueDate}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    تاريخ الاستحقاق
                  </span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.dueDate}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                  البنود
                </h3>
                <div className="space-y-2">
                  {selectedInvoice.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-800"
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
              <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
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
                    ضريبة (%8):
                  </span>
                  <span className="font-medium text-gray-800 dark:text-white/90">
                    {selectedInvoice.tax}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                  <span className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    المبلغ الاجمالي:
                  </span>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white/90">
                    {selectedInvoice.total}
                  </span>
                </div>
              </div>

              {/* Payment Log */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                  سجل الدفع
                </h3>
                {selectedInvoice.payments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInvoice.payments.map((payment, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <div className="mb-1 flex justify-between text-sm">
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

              {/* Action Buttons */}
              <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <Button
                  size="sm"
                  className="w-full bg-purple-500 hover:bg-purple-600"
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
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">
              اختر فاتورة لعرض التفاصيل
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
