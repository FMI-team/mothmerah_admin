"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuthHeader } from "../../../services/auth";
import { Modal } from "../ui/modal";
import Label from "../form/Label";

const AUCTION_TYPES = [
  { auction_type_id: 1, type_name_key: "STANDARD_ENGLISH_AUCTION", label: "مزاد إنجليزي قياسي" },
];



const UNITS_OF_MEASURE = [
  { unit_id: 1, label: "كيلوغرام (kg)" },
];

interface ProductOption {
  product_id: string;
  name: string;
}

interface CreateAuctionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
  fetchAllProducts?: boolean;
}

function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

const defaultStart = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
};
const defaultEnd = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  d.setHours(12, 0, 0, 0);
  return toDatetimeLocal(d.toISOString());
};

const API_BASE = "https://api-testing.mothmerah.sa";

export default function CreateAuctionForm({
  isOpen,
  onClose,
  onSuccess,
  fetchAllProducts = false,
}: CreateAuctionFormProps) {
  const [sellerUserId, setSellerUserId] = useState<string>("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [productId, setProductId] = useState<string>("");
  const [auctionTypeId, setAuctionTypeId] = useState<string>("1");
  const [auctionStatusId, setAuctionStatusId] = useState<string>("1");
  const [startTimestamp, setStartTimestamp] = useState<string>("");
  const [endTimestamp, setEndTimestamp] = useState<string>("");
  const [startingPricePerUnit, setStartingPricePerUnit] = useState<string>("");
  const [minimumBidIncrement, setMinimumBidIncrement] = useState<string>("");
  const [quantityOffered, setQuantityOffered] = useState<string>("1");
  const [unitOfMeasureIdForQuantity, setUnitOfMeasureIdForQuantity] = useState<string>("1");

  const fetchUser = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/users/me", {
        method: "GET",
        headers: { "Content-Type": "application/json", ...authHeader },
      });
      if (!response.ok) throw new Error("فشل في جلب بيانات المستخدم");
      const data = await response.json();
      const uid = data.user_id ?? data.id ?? data.sub ?? "";
      setSellerUserId(uid);
    } catch {
      setSellerUserId("");
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const authHeader = getAuthHeader();
      const url = fetchAllProducts
        ? `${API_BASE}/api/v1/products/`
        : `${API_BASE}/api/v1/products/me`;
      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...authHeader },
      });
      if (!response.ok) throw new Error("فشل في جلب المنتجات");
      const data: Array<{
        product_id: string;
        seller_user_id?: string;
        translations?: Array<{ language_code: string; translated_product_name?: string }>;
      }> = await response.json();
      const list = (data || []).map((p) => {
        const ar = p.translations?.find((t) => t.language_code === "ar");
        return {
          product_id: p.product_id,
          name: ar?.translated_product_name || p.product_id,
        };
      });
      setProducts(list);
      if (list.length > 0) setProductId((prev) => prev || list[0].product_id);
    } catch {
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [fetchAllProducts]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setProductId("");
      setStartTimestamp(defaultStart());
      setEndTimestamp(defaultEnd());
      setAuctionTypeId("1");
      setAuctionStatusId("1");
      setStartingPricePerUnit("");
      setMinimumBidIncrement("1");
      setQuantityOffered("1");
      setUnitOfMeasureIdForQuantity("1");
      fetchUser();
      fetchProducts();
    }
  }, [isOpen, fetchUser, fetchProducts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerUserId) {
      setError("لم يتم تحديد البائع. تأكد من تسجيل الدخول.");
      return;
    }
    if (!productId) {
      setError("يرجى اختيار المنتج");
      return;
    }
    const start = startTimestamp ? new Date(startTimestamp).toISOString() : new Date().toISOString();
    const end = endTimestamp ? new Date(endTimestamp).toISOString() : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const body = {
      seller_user_id: sellerUserId,
      product_id: productId,
      auction_type_id: parseInt(auctionTypeId, 10) || 1,
      auction_status_id: parseInt(auctionStatusId, 10) || 1,
      start_timestamp: start,
      end_timestamp: end,
      starting_price_per_unit: parseFloat(startingPricePerUnit) || 0,
      minimum_bid_increment: parseFloat(minimumBidIncrement) || 0,
      quantity_offered: parseFloat(quantityOffered) || 1,
      unit_of_measure_id_for_quantity: parseInt(unitOfMeasureIdForQuantity, 10) || 1,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/auctions/", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { detail?: string })?.detail || "فشل في إنشاء المزاد"
        );
      }
      onClose();
      await onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في إنشاء المزاد");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">
          إنشاء مزاد جديد
        </h2>
        {error && (
          <div className="mb-4 p-3 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
            {error}
          </div>
        )}
        {(isLoadingUser || isLoadingProducts || (fetchAllProducts)) && !sellerUserId && products.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            جاري التحميل...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="product_id">المنتج <span className="text-error-500">*</span></Label>
              <select
                id="product_id"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className={inputClass}
                required
              >
                <option value="">اختر المنتج</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="auction_type_id">نوع المزاد</Label>
                <select
                  id="auction_type_id"
                  value={auctionTypeId}
                  onChange={(e) => setAuctionTypeId(e.target.value)}
                  className={inputClass}
                >
                  {AUCTION_TYPES.map((t) => (
                    <option key={t.auction_type_id} value={String(t.auction_type_id)}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="start_timestamp">تاريخ ووقت البدء</Label>
                <input
                  id="start_timestamp"
                  type="datetime-local"
                  value={startTimestamp}
                  onChange={(e) => setStartTimestamp(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_timestamp">تاريخ ووقت الانتهاء</Label>
                <input
                  id="end_timestamp"
                  type="datetime-local"
                  value={endTimestamp}
                  onChange={(e) => setEndTimestamp(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="starting_price_per_unit">السعر الابتدائي لكل وحدة (ر.س)</Label>
                <input
                  id="starting_price_per_unit"
                  type="number"
                  step="0.01"
                  min="0"
                  value={startingPricePerUnit}
                  onChange={(e) => setStartingPricePerUnit(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minimum_bid_increment">الحد الأدنى للزيادة (ر.س)</Label>
                <input
                  id="minimum_bid_increment"
                  type="number"
                  step="0.01"
                  min="0"
                  value={minimumBidIncrement}
                  onChange={(e) => setMinimumBidIncrement(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="quantity_offered">الكمية المعروضة</Label>
                <input
                  id="quantity_offered"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantityOffered}
                  onChange={(e) => setQuantityOffered(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <Label htmlFor="unit_of_measure_id_for_quantity">وحدة القياس للكمية</Label>
                <select
                  id="unit_of_measure_id_for_quantity"
                  value={unitOfMeasureIdForQuantity}
                  onChange={(e) => setUnitOfMeasureIdForQuantity(e.target.value)}
                  className={inputClass}
                >
                  {UNITS_OF_MEASURE.map((u) => (
                    <option key={u.unit_id} value={String(u.unit_id)}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/3 disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !sellerUserId || !productId}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "جاري الإنشاء..." : "إنشاء المزاد"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
