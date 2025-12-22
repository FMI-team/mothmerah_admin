"use client";

import React, { useState } from "react";
import { MoreDotIcon, PlusIcon } from "@/icons";
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

type TicketPriority = "منخفضة" | "متوسطة" | "عالية";
type TicketStatus = "جديدة" | "قيد المعالجة" | "بانتظار الرد" | "مغلقة";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  type: string;
  requesterName: string;
  priority: TicketPriority;
  status: TicketStatus;
  sla: string;
  lastUpdate: string;
  createdAt: string;
}

const mockTickets: SupportTicket[] = [
  {
    id: "1",
    ticketNumber: "TK-10452",
    title: "عنوان التذكرة",
    type: "تقنية",
    requesterName: "اسم المستخدم",
    priority: "منخفضة",
    status: "جديدة",
    sla: "متبقي 3 أيام",
    lastUpdate: "22/05/2025",
    createdAt: "20/05/2025",
  },
  {
    id: "2",
    ticketNumber: "TK-10453",
    title: "عنوان التذكرة",
    type: "دفع",
    requesterName: "اسم المستخدم",
    priority: "متوسطة",
    status: "قيد المعالجة",
    sla: "متأخر",
    lastUpdate: "01/08/2023",
    createdAt: "30/07/2023",
  },
  {
    id: "3",
    ticketNumber: "TK-10454",
    title: "عنوان التذكرة",
    type: "مزاد",
    requesterName: "اسم المستخدم",
    priority: "عالية",
    status: "بانتظار الرد",
    sla: "متأخر",
    lastUpdate: "05/09/2022",
    createdAt: "03/09/2022",
  },
  {
    id: "4",
    ticketNumber: "TK-10455",
    title: "عنوان التذكرة",
    type: "RFQ",
    requesterName: "اسم المستخدم",
    priority: "عالية",
    status: "قيد المعالجة",
    sla: "متبقي 5 أيام",
    lastUpdate: "22/05/2025",
    createdAt: "21/05/2025",
  },
  {
    id: "5",
    ticketNumber: "TK-10456",
    title: "عنوان التذكرة",
    type: "مخزون",
    requesterName: "اسم المستخدم",
    priority: "منخفضة",
    status: "قيد المعالجة",
    sla: "متبقي 8 أيام",
    lastUpdate: "01/08/2023",
    createdAt: "31/07/2023",
  },
  {
    id: "6",
    ticketNumber: "TK-10457",
    title: "عنوان التذكرة",
    type: "تقنية",
    requesterName: "اسم المستخدم",
    priority: "متوسطة",
    status: "مغلقة",
    sla: "متأخر",
    lastUpdate: "05/09/2022",
    createdAt: "02/09/2022",
  },
];

const getStatusBadgeColor = (
  status: TicketStatus
): "success" | "warning" | "error" | "info" | "primary" => {
  switch (status) {
    case "جديدة":
      return "primary";
    case "قيد المعالجة":
      return "info";
    case "بانتظار الرد":
      return "warning";
    case "مغلقة":
      return "success";
    default:
      return "primary";
  }
};

const getPriorityBadgeColor = (
  priority: TicketPriority
): "success" | "warning" | "error" | "info" | "primary" => {
  switch (priority) {
    case "منخفضة":
      return "success";
    case "متوسطة":
      return "warning";
    case "عالية":
      return "error";
    default:
      return "primary";
  }
};

export default function SupportTicketsPage() {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [actionDropdownOpen, setActionDropdownOpen] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const paginatedTickets = mockTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalItems = mockTickets.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTickets.length === paginatedTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(paginatedTickets.map((ticket) => ticket.id));
    }
  };

  // Simple derived summary metrics
  const openTicketsCount = mockTickets.filter(
    (t) => t.status !== "مغلقة"
  ).length;
  const todayTicketsCount = 25; // placeholder
  const highPriorityCount = mockTickets.filter(
    (t) => t.priority === "عالية"
  ).length;
  const avgResponseTimeDays = 5; // placeholder

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
            مركز الدعم - تذاكر الدعم
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            متابعة ومعالجة جميع تذاكر الدعم الفني والتشغيلي مع التحكم الكامل في الأولويات وحالات التذاكر.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-purple-600">
          <PlusIcon className="w-4 h-4" />
          إنشاء تذكرة
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/3 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-wrap gap-3">
          <select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
            <option>الحالة: الكل</option>
            <option>جديدة</option>
            <option>قيد المعالجة</option>
            <option>بانتظار الرد</option>
            <option>مغلقة</option>
          </select>
          <select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
            <option>النوع: الكل</option>
            <option>تقنية</option>
            <option>دفع</option>
            <option>مزاد</option>
            <option>RFQ</option>
          </select>
          <select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
            <option>الجهة: الكل</option>
            <option>العميل</option>
            <option>البائع</option>
          </select>
          <select className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
            <option>اسم الموظف: الكل</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              تاريخ إنشاء التذكرة
            </span>
            <input
              type="text"
              placeholder="12/02/2025"
              className="h-10 w-28 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
            <input
              type="text"
              placeholder="18/02/2025"
              className="h-10 w-28 rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                إجمالي التذاكر المفتوحة
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {openTicketsCount.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +5.3%
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                تذاكر جديدة اليوم
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {todayTicketsCount.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +3.9%
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                تذاكر عالية الأولوية
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {highPriorityCount.toLocaleString("ar-SA")}
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +1.3%
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-4 dark:border-purple-900/40 dark:bg-purple-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs text-purple-700/80 dark:text-purple-200">
                متوسط وقت الرد
              </p>
              <p className="mt-2 text-xl font-bold text-purple-900 dark:text-purple-50">
                {avgResponseTimeDays} أيام
              </p>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-300">
              +1.3%
            </div>
          </div>
        </div>
      </div>

      {/* Tickets table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/3 sm:px-6">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 dark:border-gray-800">
              <TableRow>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        paginatedTickets.length > 0 &&
                        selectedTickets.length === paginatedTickets.length
                      }
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                    />
                    رقم التذكرة
                  </div>
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  عنوان التذكرة
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  نوع التذكرة
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  مقدم التذكرة
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  الأولوية
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
                  SLA
                </TableCell>
                <TableCell
                  isHeader
                  className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  آخر تحديث
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
              {paginatedTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={() => toggleTicketSelection(ticket.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800"
                      />
                      <span className="font-medium text-theme-sm text-gray-800 dark:text-white/90">
                        {ticket.ticketNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {ticket.title}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {ticket.type}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {ticket.requesterName}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getPriorityBadgeColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge size="sm" color={getStatusBadgeColor(ticket.status)}>
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-800 dark:text-white/90">
                    {ticket.sla}
                  </TableCell>
                  <TableCell className="py-3 text-theme-sm text-gray-500 dark:text-gray-400">
                    {ticket.lastUpdate}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActionDropdownOpen(
                              actionDropdownOpen === ticket.id ? null : ticket.id
                            )
                          }
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                        >
                          <MoreDotIcon className="h-5 w-5" />
                        </button>
                        <Dropdown
                          isOpen={actionDropdownOpen === ticket.id}
                          onClose={() => setActionDropdownOpen(null)}
                          className="absolute left-0 z-50 mt-2 w-40 p-2"
                        >
                          <DropdownItem
                            onItemClick={() => setActionDropdownOpen(null)}
                            className="flex w-full rounded-lg font-normal text-right text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            عرض التفاصيل
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => setActionDropdownOpen(null)}
                            className="flex w-full rounded-lg font-normal text-right text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                          >
                            تعديل
                          </DropdownItem>
                          <DropdownItem
                            onItemClick={() => setActionDropdownOpen(null)}
                            className="flex w-full rounded-lg font-normal text-right text-gray-500 hover:bg-gray-100 hover:text-red-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-red-300"
                          >
                            إغلاق / حذف
                          </DropdownItem>
                        </Dropdown>
                      </div>
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
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              السابق
            </button>
            {[1, 2].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  currentPage === page
                    ? "bg-purple-500 text-white"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage >= totalPages}
              className="h-10 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


