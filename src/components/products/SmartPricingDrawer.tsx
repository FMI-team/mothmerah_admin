"use client";

import { useEffect, useState } from "react";
import { AxiosError } from "axios";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { assignPricingRuleToPackagingOption, createPricingRule } from "../../../services/pricing";

interface Tier {
  id: number;
  from: string;
  to: string;
  price: string;
}

type DiscountType = "percentage" | "fixed";

const DISCOUNT_TYPE_MAP: Record<DiscountType, "PERCENTAGE" | "NEW_PRICE"> = {
  percentage: "PERCENTAGE",
  fixed: "NEW_PRICE"
};

interface SmartPricingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  packagingOptionId?: number;
  onSave?: () => void;
}

const slugify = (value: string): string => value.trim().replace(/\s+/g, "_").replace(/[^\p{L}\p{N}_]/gu, "").toUpperCase();

const buildRuleNameKey = (productName?: string): string => {
  const base = productName ? slugify(productName) : "";
  return `${base ? `${base}_` : ""}PRICING_${Date.now()}`;
};

const apiDetailToString = (detail: unknown): string => {
  if (detail == null) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return (
      detail.map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg?: string }).msg) : String(d))).filter(Boolean).join(" — ") || ""
    );
  }
  if (typeof detail === "object" && detail !== null && "msg" in detail) return String((detail as { msg: unknown }).msg);
  return String(detail);
};

const getCreatedRuleId = (data: unknown): number | null => {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const id = record.rule_id ?? record.pricing_rule_id ?? record.id;
  return typeof id === "number" ? id : null;
};


const defaultTiers = (): Tier[] => [
  { id: 1, from: "1", to: "10", price: "50" },
  { id: 2, from: "11", to: "50", price: "45" }
];

const TrendUpIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="m3 17 6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 7v5h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CoinIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
  </svg>
);

const tierInputClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-center text-sm font-semibold text-purple-600 focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-purple-300";

export default function SmartPricingDrawer({ isOpen, onClose, productName, packagingOptionId, onSave }: SmartPricingDrawerProps) {
  const [enabled, setEnabled] = useState(true);
  const [discountType, setDiscountType] = useState<DiscountType>("fixed");
  const [tiers, setTiers] = useState<Tier[]>(defaultTiers);
  const [pricingRuleId, setPricingRuleId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEnabled(true);
      setDiscountType("fixed");
      setTiers(defaultTiers());
      setPricingRuleId(null);
      setIsSaving(false);
      setIsAssigning(false);
      setError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const updateTier = (id: number, field: keyof Omit<Tier, "id">, value: string) => {
    setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const addTier = () => {
    setTiers((prev) => {
      const lastTo = prev.length > 0 ? parseInt(prev[prev.length - 1].to, 10) : 0;
      const nextFrom = Number.isFinite(lastTo) ? lastTo + 1 : "";
      const nextId = (prev.reduce((max, t) => Math.max(max, t.id), 0) || 0) + 1;
      return [...prev, { id: nextId, from: String(nextFrom), to: "", price: "" }];
    });
  };

  const removeTier = (id: number) => {
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleEnabled = async () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    setError(null);

    if (pricingRuleId == null) return;

    if (packagingOptionId == null) {
      setEnabled(!nextEnabled);
      setError("لا يوجد خيار تغليف لهذا المنتج لتفعيل قاعدة التسعير عليه");
      return;
    }

    setIsAssigning(true);
    try {
      const response = await assignPricingRuleToPackagingOption({
        rule_id: pricingRuleId,
        packaging_option_id: packagingOptionId,
        is_active: nextEnabled
      });

      if (response.status !== 200 && response.status !== 201) {
        const data = response.data as { detail?: unknown };
        throw new Error(apiDetailToString(data?.detail) || "فشل تحديث حالة قاعدة التسعير");
      }
    } catch (err) {
      setEnabled(!nextEnabled);
      const axiosError = err as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setError(apiDetailToString(detail) || axiosError.message || "فشل تحديث حالة قاعدة التسعير");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleSave = async () => {
    const discount_type = DISCOUNT_TYPE_MAP[discountType];

    const validTiers = tiers.filter(
      (t) => Number.isFinite(Number(t.from)) && Number.isFinite(Number(t.price)) && t.from !== "" && t.price !== ""
    );

    if (validTiers.length === 0) {
      setError("يرجى إضافة شريحة واحدة على الأقل بقيم صحيحة");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (packagingOptionId == null) {
        setError("لا يوجد خيار تغليف لهذا المنتج لتفعيل قاعدة التسعير عليه");
        return;
      }

      const payload =
        discount_type === "NEW_PRICE"
          ? {
              rule_name_key: buildRuleNameKey(productName),
              discount_type,
              levels: validTiers.map((t) => ({
                rule_id: 0,
                minimum_quantity: Number(t.from),
                price_per_unit_at_level: Number(t.price),
                level_description_key: `${t.from || 0}-${t.to || 0}`
              }))
            }
          : {
              rule_name_key: buildRuleNameKey(productName),
              discount_type,
              levels: validTiers.map((t) => ({
                rule_id: 0,
                minimum_quantity: Number(t.from),
                discount_value: Number(t.price),
                level_description_key: `${t.from || 0}-${t.to || 0}`
              }))
            };

      const response = await createPricingRule(payload);

      if (response.status !== 200 && response.status !== 201) {
        const data = response.data as { detail?: unknown };
        setError(apiDetailToString(data?.detail) || "فشل في حفظ إعدادات التسعير");
        return;
      }

      const createdRuleId = getCreatedRuleId(response.data);
      if (createdRuleId == null) {
        setError("تم إنشاء القاعدة، لكن لم يتم إرجاع رقم القاعدة لتفعيلها على المنتج");
        return;
      }

      setPricingRuleId(createdRuleId);
      await assignPricingRuleToPackagingOption({
        rule_id: createdRuleId,
        packaging_option_id: packagingOptionId,
        is_active: enabled
      });

      onSave?.();
      onClose();
    } catch (err) {
      const axiosError = err as AxiosError<{ detail?: unknown }>;
      const detail = axiosError.response?.data?.detail;
      setError(apiDetailToString(detail) || axiosError.message || "فشل في حفظ إعدادات التسعير");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-99999">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 left-0 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-gray-900">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-6 dark:border-gray-800">
          <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700
          dark:hover:bg-gray-800">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="text-right">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">إعداد التسعير الذكي والخصومات</h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              قم بتخصيص شرائح التسعير بناءً على كميات الطلب
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <button type="button" role="switch" aria-checked={enabled} onClick={handleToggleEnabled} disabled={isAssigning || isSaving}
            className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${enabled ? "bg-purple-500" : "bg-gray-200 dark:bg-white/10"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-sm transition-all ${enabled ? "left-0.5" : "left-[calc(100%-1.375rem)]"}`} />
            </button>
            <div className="flex flex-1 items-center justify-end gap-3 text-right">
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-white/90">تفعيل التسعير الديناميكي للمنتج</p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  يسمح للنظام بتغيير السعر تلقائياً حسب الكمية
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-500 dark:bg-purple-500/10">
                <TrendUpIcon className="h-5 w-5" />
              </span>
            </div>
          </div>

          <div>
            <p className="mb-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">نوع الخصم واحتساب السعر</p>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setDiscountType("percentage")}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition ${
                  discountType === "percentage"
                    ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500 dark:bg-purple-500/10"
                    : "border-gray-200 hover:border-purple-300 dark:border-gray-700"
                }`}>
                <span className="text-2xl font-bold text-gray-700 dark:text-gray-200">%</span>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">نسبة مئوية من السعر الإجمالي</span>
              </button>

              <button type="button" onClick={() => setDiscountType("fixed")}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition ${
                  discountType === "fixed"
                    ? "border-purple-500 bg-purple-50 ring-1 ring-purple-500 dark:bg-purple-500/10"
                    : "border-gray-200 hover:border-purple-300 dark:border-gray-700"
                }`}>
                {discountType === "fixed" && (
                  <span className="absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="m5 13 4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
                <CoinIcon className="h-6 w-6 text-purple-500" />
                <span className="text-xs font-semibold text-gray-800 dark:text-white/90">سعر ثابت للقطعة بناءً على الكمية</span>
              </button>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-300">
                عدد الشرائح: {tiers.length}
              </span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">شرائح الكميات والأسعار</p>
            </div>

            <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 px-1 pb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span className="text-center">من كمية</span>
                <span className="text-center">إلى كمية</span>
                <span className="text-center">سعر الوحدة (ر.س)</span>
                <span className="px-1 text-center">إجراء</span>
              </div>

              <div className="space-y-2">
                {tiers.map((tier) => (
                  <div key={tier.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                    <input type="number" value={tier.from} onChange={(e) => updateTier(tier.id, "from", e.target.value)} className={tierInputClass} />
                    <input type="number" value={tier.to} onChange={(e) => updateTier(tier.id, "to", e.target.value)} className={tierInputClass} />
                    <input type="number" value={tier.price} onChange={(e) => updateTier(tier.id, "price", e.target.value)} className={tierInputClass} />
                    <button type="button" onClick={() => removeTier(tier.id)} className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-5
                     dark:hover:bg-red-500/10">
                      <TrashBinIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="button" onClick={addTier} className="mt-3 flex w-full items-center justify-center gap-2 text-sm font-medium text-purple-600 transition hover:text-purple-70
             dark:text-purple-300">
              <PlusIcon className="h-4 w-4" />
              إضافة شريحة جديدة
            </button>
          </div>
        </div>

        <div className="border-t border-gray-100 p-6 dark:border-gray-800">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button type="button" onClick={handleSave} disabled={isSaving} className="flex-1 rounded-lg bg-purple-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition
            hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving} className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-200
            disabled:opacity-60 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}