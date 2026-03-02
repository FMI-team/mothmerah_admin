"use client";

import { useState, useEffect, useCallback } from "react";
import Badge from "../ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../ui/table";
import Button from "../ui/button/Button";
import pdfMake from "pdfmake/build/pdfmake";

const ROBOTO_VFS_NAMES = [
  "Roboto-Regular.ttf",
  "Roboto-Medium.ttf",
  "Roboto-Bold.ttf",
  "Roboto-Italic.ttf",
  "Roboto-BoldItalic.ttf",
] as const;
const CAIRO_VFS_NAMES = ["Cairo-Regular.ttf", "Cairo-Bold.ttf"] as const;

let pdfFontsLoaded = false;
let pdfDefaultFont = "Roboto";

async function ensurePdfFontsLoaded(): Promise<void> {
  if (pdfFontsLoaded) return;
  const pm = pdfMake as unknown as {
    addVirtualFileSystem: (vfs: Record<string, string>) => void;
    addFonts: (fonts: Record<string, unknown>) => void;
  };

  const vfs: Record<string, string> = {};
  const base =
    typeof window !== "undefined" ? `${window.location.origin}/fonts` : "/fonts";

  for (const name of ROBOTO_VFS_NAMES) {
    const res = await fetch(`${base}/${name}`);
    if (!res.ok) {
      throw new Error(`خط: تعذر تحميل الملف ${name} (${res.status})`);
    }
    const buf = await res.arrayBuffer();
    const b64 = btoa(
      new Uint8Array(buf).reduce((acc, b) => acc + String.fromCharCode(b), "")
    );
    vfs[name] = b64;
  }

  let cairoOk = true;
  for (const name of CAIRO_VFS_NAMES) {
    const res = await fetch(`${base}/${name}`);
    if (!res.ok) {
      cairoOk = false;
      break;
    }
    const buf = await res.arrayBuffer();
    const b64 = btoa(
      new Uint8Array(buf).reduce((acc, b) => acc + String.fromCharCode(b), "")
    );
    vfs[name] = b64;
  }

  pm.addVirtualFileSystem(vfs);
  pm.addFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Bold.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-BoldItalic.ttf",
    },
  });
  if (cairoOk) {
    pm.addFonts({
      Cairo: {
        normal: "Cairo-Regular.ttf",
        bold: "Cairo-Bold.ttf",
        italics: "Cairo-Regular.ttf",
        bolditalics: "Cairo-Bold.ttf",
      },
    });
    pdfDefaultFont = "Cairo";
  }
  pdfFontsLoaded = true;
}

/** يحوّل رابط صورة إلى dataURL لاستخدامها في pdfMake (لا يقبل روابط مباشرة). */
async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

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

export default function InvoicesPage() {
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
  
  // PDF states
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

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

  // دالة إنشاء PDF باستخدام pdfmake
  const generatePDF = async (invoice: Invoice) => {
    setPdfGenerating(true);
    setPdfError(null);

    try {
      await ensurePdfFontsLoaded();
      const logoDataUrl = invoice.logoUrl ? await fetchImageAsDataUrl(invoice.logoUrl) : null;
      // تحضير بيانات الجدول
      const tableBody = [
        [
          { text: 'الوصف', style: 'tableHeader' },
          { text: 'الكمية', style: 'tableHeader' },
          { text: 'السعر', style: 'tableHeader' }
        ],
        ...invoice.items.map(item => [
          { text: item.name, style: 'tableCell' },
          { text: item.quantity, style: 'tableCell' },
          { text: item.price, style: 'tableCell' }
        ])
      ];

      // تحضير سجل المدفوعات
      const paymentsContent = invoice.payments.length > 0 
        ? invoice.payments.map(payment => [
            {
              stack: [
                { text: payment.date, style: 'paymentDate' },
                { text: payment.method, style: 'paymentMethod' }
              ],
              alignment: 'right'
            },
            { text: payment.amount, style: 'paymentAmount', alignment: 'left' }
          ])
        : [];

      // تعريف محتوى PDF
      const docDefinition = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
          font: pdfDefaultFont,
          direction: 'rtl',
          alignment: 'right'
        },
        header: logoDataUrl ? {
          columns: [
            { image: logoDataUrl, width: 100, alignment: 'left' },
            { text: '', width: '*' }
          ],
          margin: [40, 20, 40, 10]
        } : undefined,
        content: [
          // عنوان الفاتورة
          {
            text: 'فاتورة',
            style: 'mainTitle',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          
          // رقم الفاتورة
          {
            text: invoice.invoiceNumber,
            style: 'invoiceNumber',
            alignment: 'center',
            margin: [0, 0, 0, 15]
          },

          // حالة الفاتورة
          {
            text: invoice.status,
            style: `status${invoice.status}`,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },

          // معلومات العميل
          {
            stack: [
              { text: 'معلومات العميل', style: 'sectionTitle' },
              { text: `الاسم: ${invoice.clientName}`, style: 'infoText' },
              ...(invoice.clientEmail ? [{ text: `البريد الإلكتروني: ${invoice.clientEmail}`, style: 'infoText' }] : []),
              { text: `تاريخ الإصدار: ${invoice.issueDate}`, style: 'infoText' },
              { text: `تاريخ الاستحقاق: ${invoice.dueDate}`, style: 'infoText' },
              ...(invoice.checkoutUrl ? [{ text: `رابط الدفع: ${invoice.checkoutUrl}`, style: 'link' }] : [])
            ],
            margin: [0, 0, 0, 20]
          },

          // بنود الفاتورة
          {
            text: 'بنود الفاتورة',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: tableBody,
              layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#F3F4F6' : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#E5E7EB',
                vLineColor: () => '#E5E7EB',
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 8,
                paddingBottom: () => 8,
              }
            },
            margin: [0, 0, 0, 20]
          },

          // الملخص المالي
          {
            stack: [
              {
                columns: [
                  { text: 'المجموع الفرعي:', alignment: 'right', width: '70%' },
                  { text: invoice.subtotal, alignment: 'left', width: '30%' }
                ],
                margin: [0, 0, 0, 5]
              },
              {
                columns: [
                  { text: 'الضريبة:', alignment: 'right', width: '70%' },
                  { text: invoice.tax, alignment: 'left', width: '30%' }
                ],
                margin: [0, 0, 0, 5]
              },
              {
                columns: [
                  { text: 'الإجمالي:', alignment: 'right', width: '70%', bold: true, fontSize: 14 },
                  { text: invoice.total, alignment: 'left', width: '30%', bold: true, fontSize: 16 }
                ],
                margin: [0, 10, 0, 0]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // سجل المدفوعات
          ...(paymentsContent.length > 0 ? [
            { text: 'سجل المدفوعات', style: 'sectionTitle', margin: [0, 0, 0, 10] },
            ...paymentsContent.map(payment => ({
              columns: payment,
              margin: [0, 0, 0, 10]
            }))
          ] : [])
        ],
        styles: {
          mainTitle: {
            fontSize: 24,
            bold: true,
            color: '#1F2937'
          },
          invoiceNumber: {
            fontSize: 12,
            color: '#6B7280'
          },
          sectionTitle: {
            fontSize: 16,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 10]
          },
          infoText: {
            fontSize: 11,
            color: '#374151',
            margin: [0, 2, 0, 2]
          },
          link: {
            fontSize: 11,
            color: '#7C3AED',
            decoration: 'underline'
          },
          tableHeader: {
            fontSize: 12,
            bold: true,
            color: '#4B5563',
            alignment: 'center'
          },
          tableCell: {
            fontSize: 11,
            color: '#374151',
            alignment: 'center'
          },
          statusمدفوعة: {
            fontSize: 12,
            bold: true,
            color: '#065F46',
            background: '#D1FAE5',
            alignment: 'center',
            margin: [0, 0, 0, 0]
          },
          statusقيد_الانتظار: {
            fontSize: 12,
            bold: true,
            color: '#92400E',
            background: '#FEF3C7',
            alignment: 'center'
          },
          statusمتأخرة: {
            fontSize: 12,
            bold: true,
            color: '#991B1B',
            background: '#FEE2E2',
            alignment: 'center'
          },
          paymentDate: {
            fontSize: 10,
            color: '#6B7280'
          },
          paymentAmount: {
            fontSize: 11,
            color: '#1F2937',
            bold: true
          },
          paymentMethod: {
            fontSize: 9,
            color: '#9CA3AF'
          }
        }
      };

      // إنشاء وتحميل PDF (الخطوط مسجّلة مسبقاً عبر addVirtualFileSystem/addFonts)
      pdfMake.createPdf(docDefinition as unknown as Parameters<typeof pdfMake.createPdf>[0]).download(`invoice-${invoice.invoiceNumber}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfError(error instanceof Error ? error.message : 'فشل إنشاء PDF');
    } finally {
      setPdfGenerating(false);
    }
  };

  // دالة معاينة PDF
  const previewPDF = async (invoice: Invoice) => {
    setPdfGenerating(true);
    setPdfError(null);

    try {
      await ensurePdfFontsLoaded();
      // نفس تعريف docDefinition السابق
      const docDefinition = {
        // ... نفس المحتوى السابق
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 40],
        defaultStyle: {
          font: pdfDefaultFont,
          direction: 'rtl',
          alignment: 'right'
        },
        content: [
          {
            text: 'فاتورة',
            style: 'mainTitle',
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            text: invoice.invoiceNumber,
            style: 'invoiceNumber',
            alignment: 'center',
            margin: [0, 0, 0, 15]
          },
          {
            text: invoice.status,
            style: `status${invoice.status}`,
            alignment: 'center',
            margin: [0, 0, 0, 20]
          },
          {
            stack: [
              { text: 'معلومات العميل', style: 'sectionTitle' },
              { text: `الاسم: ${invoice.clientName}`, style: 'infoText' },
              ...(invoice.clientEmail ? [{ text: `البريد الإلكتروني: ${invoice.clientEmail}`, style: 'infoText' }] : []),
              { text: `تاريخ الإصدار: ${invoice.issueDate}`, style: 'infoText' },
              { text: `تاريخ الاستحقاق: ${invoice.dueDate}`, style: 'infoText' },
              ...(invoice.checkoutUrl ? [{ text: `رابط الدفع: ${invoice.checkoutUrl}`, style: 'link' }] : [])
            ],
            margin: [0, 0, 0, 20]
          },
          {
            text: 'بنود الفاتورة',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto'],
              body: [
                [
                  { text: 'الوصف', style: 'tableHeader' },
                  { text: 'الكمية', style: 'tableHeader' },
                  { text: 'السعر', style: 'tableHeader' }
                ],
                ...invoice.items.map(item => [
                  { text: item.name, style: 'tableCell' },
                  { text: item.quantity, style: 'tableCell' },
                  { text: item.price, style: 'tableCell' }
                ])
              ],
              layout: {
                fillColor: (rowIndex: number) => rowIndex === 0 ? '#F3F4F6' : null,
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#E5E7EB',
                vLineColor: () => '#E5E7EB',
              }
            },
            margin: [0, 0, 0, 20]
          },
          {
            stack: [
              {
                columns: [
                  { text: 'المجموع الفرعي:', alignment: 'right', width: '70%' },
                  { text: invoice.subtotal, alignment: 'left', width: '30%' }
                ],
                margin: [0, 0, 0, 5]
              },
              {
                columns: [
                  { text: 'الضريبة:', alignment: 'right', width: '70%' },
                  { text: invoice.tax, alignment: 'left', width: '30%' }
                ],
                margin: [0, 0, 0, 5]
              },
              {
                columns: [
                  { text: 'الإجمالي:', alignment: 'right', width: '70%', bold: true, fontSize: 14 },
                  { text: invoice.total, alignment: 'left', width: '30%', bold: true, fontSize: 16 }
                ],
                margin: [0, 10, 0, 0]
              }
            ],
            margin: [0, 0, 0, 20]
          }
        ],
        styles: {
          mainTitle: {
            fontSize: 24,
            bold: true,
            color: '#1F2937'
          },
          invoiceNumber: {
            fontSize: 12,
            color: '#6B7280'
          },
          sectionTitle: {
            fontSize: 16,
            bold: true,
            color: '#1F2937',
            margin: [0, 0, 0, 10]
          },
          infoText: {
            fontSize: 11,
            color: '#374151',
            margin: [0, 2, 0, 2]
          },
          link: {
            fontSize: 11,
            color: '#7C3AED',
            decoration: 'underline'
          },
          tableHeader: {
            fontSize: 12,
            bold: true,
            color: '#4B5563',
            alignment: 'center'
          },
          tableCell: {
            fontSize: 11,
            color: '#374151',
            alignment: 'center'
          },
          statusمدفوعة: {
            fontSize: 12,
            bold: true,
            color: '#065F46',
            background: '#D1FAE5',
            alignment: 'center'
          },
          statusقيد_الانتظار: {
            fontSize: 12,
            bold: true,
            color: '#92400E',
            background: '#FEF3C7',
            alignment: 'center'
          },
          statusمتأخرة: {
            fontSize: 12,
            bold: true,
            color: '#991B1B',
            background: '#FEE2E2',
            alignment: 'center'
          }
        }
      };

      // فتح PDF في نافذة جديدة للمعاينة (الخطوط مسجّلة مسبقاً)
      pdfMake.createPdf(docDefinition as unknown as Parameters<typeof pdfMake.createPdf>[0]).open();
      
    } catch (error) {
      console.error('Error previewing PDF:', error);
      setPdfError(error instanceof Error ? error.message : 'فشل معاينة PDF');
    } finally {
      setPdfGenerating(false);
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
        <button 
          onClick={handleExportReport} 
          className="mb-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          تصدير التقرير
        </button>
        
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

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                <TableRow>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <input 
                        id="invoices-select-all" 
                        name="invoices-select-all" 
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
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">اسم العميل</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">المبلغ</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الحالة</TableCell>
                  <TableCell isHeader className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">الاجراءات</TableCell>
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
                          id={`invoice-select-${invoice.id}`} 
                          name={`invoice-select-${invoice.id}`} 
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
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <Button 
                            onClick={() => {
                              setSelectedInvoice(invoice);
                            }} 
                            className="flex w-full font-normal text-right text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
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
              {invoiceDetailsLoading && !invoiceDetails ? (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  جاري تحميل التفاصيل...
                </div>
              ) : invoiceDetailsError && !invoiceDetails ? (
                <div className="py-4 rounded-lg bg-red-50 dark:bg-red-950/30 text-sm text-red-600 dark:text-red-400">
                  {invoiceDetailsError}
                </div>
              ) : (() => {
                const displayInvoice = invoiceDetails ?? selectedInvoice;
                if (!displayInvoice) return null;
                
                return (
                  <>
                    <div className="bg-white dark:bg-white/3">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">تفاصيل الفاتورة</h2>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{displayInvoice.invoiceNumber}</p>
                      </div>

                      <div className="mb-6">
                        <Badge size="sm" color={getStatusBadgeColor(displayInvoice.status)}>
                          {displayInvoice.status}
                        </Badge>
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
                            <a 
                              href={displayInvoice.checkoutUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="mt-1 block truncate text-sm font-medium text-purple-600 hover:underline dark:text-purple-400"
                            >
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
                          <span className="text-gray-600 dark:text-gray-400"> ضريبة: </span>
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

                    {/* أزرار PDF */}
                    <div className="space-y-3 border-t border-gray-200 pt-4 dark:border-gray-800">
                      {pdfError && (
                        <p className="text-sm text-red-600 dark:text-red-400">{pdfError}</p>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => previewPDF(displayInvoice)}
                        disabled={pdfGenerating}
                      >
                        {pdfGenerating ? 'جاري التحميل...' : 'معاينة PDF'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => generatePDF(displayInvoice)}
                        disabled={pdfGenerating}
                      >
                        {pdfGenerating ? 'جاري التحميل...' : 'تحميل PDF'}
                      </Button>
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