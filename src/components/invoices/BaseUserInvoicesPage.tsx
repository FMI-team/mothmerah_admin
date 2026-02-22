"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Badge from "../ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Button from "../ui/button/Button";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail?: string;
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
  logoUrl?: string;
  checkoutUrl?: string;
}

interface MoyasarPaymentSource {
  type?: string;
  company?: string;
  name?: string;
  number?: string;
}

interface MoyasarPayment {
  id: string;
  status: string;
  amount: number;
  amount_format: string;
  created_at: string;
  source?: MoyasarPaymentSource | null;
}

interface MoyasarMetadata {
  customer_id?: string;
  customer_email?: string;
  cart_id?: string;
  client_name?: string;
  [key: string]: unknown;
}

interface MoyasarInvoice {
  id: string;
  status: string;
  amount: number;
  currency: string;
  description: string;
  amount_format: string;
  logo_url?: string | null;
  url?: string | null;
  callback_url?: string | null;
  expired_at: string;
  created_at: string;
  updated_at: string;
  back_url?: string | null;
  success_url?: string | null;
  payment_id?: string | null;
  paid_at?: string | null;
  metadata?: MoyasarMetadata | null;
  payments?: MoyasarPayment[] | null;
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

function paymentMethodFromSource(source?: MoyasarPaymentSource | null): string {
  if (!source) return "—";
  const parts: string[] = [];
  if (source.company) parts.push(source.company);
  if (source.name) parts.push(source.name);
  if (source.number) parts.push(`****${source.number.slice(-4)}`);
  if (source.type && !parts.length) parts.push(source.type);
  return parts.length ? parts.join(" · ") : "بطاقة ائتمانية";
}

const mapMoyasarInvoiceToInvoice = (moyasarInvoice: MoyasarInvoice): Invoice => {
  const amountInSAR = moyasarInvoice.amount / 100;
  const subtotal = amountInSAR * 0.92;
  const tax = amountInSAR * 0.08;
  const meta = moyasarInvoice.metadata ?? null;
  const clientName = (meta?.client_name as string) ?? (meta?.customer_id as string) ?? (meta?.customer_email as string) ?? "عميل";
  const clientEmail = meta?.customer_email as string | undefined;

  let payments: Invoice["payments"] = [];
  if (moyasarInvoice.payments && Array.isArray(moyasarInvoice.payments)) {
    payments = moyasarInvoice.payments.map((p) => ({
      date: formatDate(p.created_at),
      amount: p.amount_format ?? `${(p.amount / 100).toFixed(2)} SAR`,
      method: paymentMethodFromSource(p.source),
    }));
  } else if (moyasarInvoice.paid_at) {
    payments = [
      {
        date: formatDate(moyasarInvoice.paid_at),
        amount: moyasarInvoice.amount_format ?? `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}`,
        method: "بطاقة ائتمانية",
      },
    ];
  }

  return {
    id: moyasarInvoice.id,
    invoiceNumber: `#INV-${moyasarInvoice.id.substring(0, 8).toUpperCase()}`,
    clientName,
    clientEmail,
    amount: `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}`,
    status: mapMoyasarStatusToInvoiceStatus(moyasarInvoice.status),
    issueDate: formatDate(moyasarInvoice.created_at),
    dueDate: formatDate(moyasarInvoice.expired_at),
    items: moyasarInvoice.description
      ? [{ name: moyasarInvoice.description, quantity: "1", price: `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}` }]
      : [{ name: "فاتورة", quantity: "1", price: `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}` }],
    subtotal: `${subtotal.toFixed(2)} ${moyasarInvoice.currency}`,
    tax: `${tax.toFixed(2)} ${moyasarInvoice.currency}`,
    total: moyasarInvoice.amount_format ?? `${amountInSAR.toFixed(2)} ${moyasarInvoice.currency}`,
    payments,
    logoUrl: moyasarInvoice.logo_url ?? undefined,
    checkoutUrl: moyasarInvoice.url ?? undefined
  };
};

export default function BaseUserInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("الكل");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<Invoice | null>(null);
  const [invoiceDetailsLoading, setInvoiceDetailsLoading] = useState(false);
  const [invoiceDetailsError, setInvoiceDetailsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 4;

  const fetchInvoices = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.moyasar.com/v1/invoices?page=${page}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${process.env.NEXT_PUBLIC_CREDENTIALS}`,
          "Content-Type": "application/json",
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "فشل في جلب الفواتير");
      }
      if (!data.invoices || !Array.isArray(data.invoices)) {
        throw new Error("استجابة غير صالحة");
      }
      setInvoices(data.invoices.map(mapMoyasarInvoiceToInvoice));
      setTotalPages(data.meta?.total_pages ?? 1);
      setTotalItems(data.meta?.total_count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في جلب بيانات الفواتير");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchInvoiceDetails = useCallback(async (invoiceId: string) => {
    setInvoiceDetailsError(null);
    setInvoiceDetailsLoading(true);
    try {
      const res = await fetch(`https://api.moyasar.com/v1/invoices/${encodeURIComponent(invoiceId)}`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${process.env.NEXT_PUBLIC_CREDENTIALS}`,
          "Content-Type": "application/json",
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((data as { error?: string }).error ?? "فشل في جلب تفاصيل الفاتورة");
      }
      setInvoiceDetails(mapMoyasarInvoiceToInvoice(data as MoyasarInvoice));
    } catch (err) {
      setInvoiceDetailsError(err instanceof Error ? err.message : "فشل في جلب التفاصيل");
      setInvoiceDetails(null);
    } finally {
      setInvoiceDetailsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedInvoice) {
      fetchInvoiceDetails(selectedInvoice.id);
    } else {
      setInvoiceDetails(null);
      setInvoiceDetailsError(null);
    }
  }, [selectedInvoice, fetchInvoiceDetails]);

  useEffect(() => {
    fetchInvoices(currentPage);
  }, [currentPage, fetchInvoices]);

  const filteredInvoices =
    selectedStatus === "الكل" ? invoices : invoices.filter((inv) => inv.status === selectedStatus);

  const paginatedInvoices = filteredInvoices;

  const toggleInvoiceSelection = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId) ? prev.filter((id) => id !== invoiceId) : [...prev, invoiceId]
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
    ].map((row) => row.join(",")).join("\n");

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

  const invoiceDetailRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    const displayInvoice = invoiceDetails ?? selectedInvoice;
    if (!displayInvoice) return;
    const el = invoiceDetailRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgRatio = canvas.width / canvas.height;
      const h = Math.min(pageW / imgRatio, pageH);
      const w = h * imgRatio;
      pdf.addImage(imgData, "PNG", (pageW - w) / 2, 0, w, h);
      pdf.save(`invoice-${displayInvoice.invoiceNumber.replace(/#/g, "")}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إنشاء PDF");
    }
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
      <div className="lg:col-span-2 order-1 lg:order-1">

        <button onClick={handleExportReport} className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors
        hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"> تصدير التقرير </button>
        <div className="mb-4 flex flex-wrap gap-2">
          {["الكل", "مدفوعة", "قيد الانتظار", "متأخرة"].map((status) => (
            <button key={status} onClick={() => {
              setSelectedStatus(status);
              setCurrentPage(1);
            }} className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${selectedStatus === status ? "bg-purple-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}>{status}</button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={
                          paginatedInvoices.length > 0 &&
                          selectedInvoices.length === paginatedInvoices.length
                        } onChange={toggleSelectAll} className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" />
                      رقم الفاتورة
                    </div>
                  </TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">اسم العميل</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">المبلغ</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الحالة</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الاجراءات</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className={`cursor-pointer transition-colors ${selectedInvoice?.id === invoice.id ? "bg-purple-50 dark:bg-purple-900/10"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}`} onClick={() => setSelectedInvoice(invoice)}>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedInvoices.includes(invoice.id)} onChange={(e) => {
                            e.stopPropagation();
                            toggleInvoiceSelection(invoice.id);
                          }} className="w-4 h-4 text-brand-500 border-gray-300 rounded focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800" />
                        <span className="font-medium text-gray-800 text-theme-sm dark:text-white/90"> {invoice.invoiceNumber} </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90"> {invoice.clientName} </TableCell>
                    <TableCell className="py-3 text-gray-800 text-theme-sm dark:text-white/90"> {invoice.amount} </TableCell>
                    <TableCell className="py-3">
                      <Badge size="sm" color={getStatusBadgeColor(invoice.status)}> {invoice.status} </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <Button onClick={() => {
                                setSelectedInvoice(invoice);
                              }} className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5
                              dark:hover:text-gray-300">
                              عرض التفاصيل
                            </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 pt-6">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                عرض {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}-
                {Math.min(currentPage * itemsPerPage, totalItems)} من {totalItems}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1 || isLoading} className="rounded-lg border border-gray-200 bg-white px-4 py-2
                text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300
                dark:hover:bg-gray-700">
                  السابق
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button key={page} onClick={() => setCurrentPage(page)} disabled={isLoading} className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        currentPage === page ? "bg-purple-500 text-white"
                        : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                      }`}>
                      {page}
                    </button>
                  );
                })}
                <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages || isLoading} className="rounded-lg border border-gray-200
                bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800
                dark:text-gray-300 dark:hover:bg-gray-700">
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
              {invoiceDetailsLoading && !invoiceDetails ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">جاري تحميل التفاصيل...</div>
              ) : invoiceDetailsError && !invoiceDetails ? (
                <div className="py-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-sm text-red-600 dark:text-red-400">
                  {invoiceDetailsError}
                </div>
              ) : (() => {
                const displayInvoice = invoiceDetails ?? selectedInvoice;
                if (!displayInvoice) return null;
                return (
                  <>
              <div ref={invoiceDetailRef} className="bg-white dark:bg-white/3">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">تفاصيل الفاتورة</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{displayInvoice.invoiceNumber}</p>
              </div>

              <div className="mb-6">
                <Badge size="sm" color={getStatusBadgeColor(displayInvoice.status)}>{displayInvoice.status}</Badge>
              </div>

              <div className="mb-6 space-y-4">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">العميل</span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{displayInvoice.clientName}</p>
                  {displayInvoice.clientEmail && (
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{displayInvoice.clientEmail}</p>
                  )}
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">تاريخ الاصدار</span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{displayInvoice.issueDate}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">تاريخ الاستحقاق</span>
                  <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{displayInvoice.dueDate}</p>
                </div>
                {displayInvoice.checkoutUrl && (
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">رابط الدفع</span>
                    <a href={displayInvoice.checkoutUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block truncate text-sm font-medium text-purple-600 hover:underline
                    dark:text-purple-400">
                      {displayInvoice.checkoutUrl}
                    </a>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90">البنود</h3>
                <div className="space-y-2">
                  {displayInvoice.items.map((item, index) => (
                    <div key={index} className="flex justify-between border-b border-gray-100 py-2 text-sm dark:border-gray-800">
                      <span className="text-gray-700 dark:text-gray-300"> {item.name} </span>
                      <span className="font-medium text-gray-800 dark:text-white/90"> {item.price} </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400"> المجموع الفرعي: </span>
                  <span className="font-medium text-gray-800 dark:text-white/90"> {displayInvoice.subtotal} </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400"> ضريبة (%8): </span>
                  <span className="font-medium text-gray-800 dark:text-white/90"> {displayInvoice.tax} </span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3 dark:border-gray-700">
                  <span className="text-lg font-semibold text-gray-800 dark:text-white/90"> المبلغ الاجمالي: </span>
                  <span className="text-2xl font-bold text-gray-800 dark:text-white/90"> {displayInvoice.total} </span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-white/90"> سجل الدفع </h3>
                {displayInvoice.payments.length > 0 ? (
                  <div className="space-y-2">
                    {displayInvoice.payments.map((payment, index) => (
                      <div key={index} className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400"> {payment.date} </span>
                          <span className="font-medium text-gray-800 dark:text-white/90"> {payment.amount} </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400"> {payment.method} </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400"> لم يتم تسجيل اي مدفوعات حتى الان </p>
                )}
              </div>
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                <Button size="sm" variant="outline" className="w-full" onClick={handleDownloadPDF}>تنزيل PDF</Button>
              </div>
                  </>
                );
              })()}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
            <p className="text-center text-gray-500 dark:text-gray-400">اختر فاتورة لعرض التفاصيل</p>
          </div>
        )}
      </div>
    </div>
  );
}
