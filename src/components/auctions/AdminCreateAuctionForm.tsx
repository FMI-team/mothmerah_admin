/* eslint-disable react-hooks/exhaustive-deps */

"use client";

import { useState, useEffect, useCallback, SubmitEvent } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import { fetchAndStoreUserInfo } from "../../../services/auth";
import { readAllProducts } from "../../../services/products";
import { createAuction } from "../../../services/auctions";
import { readUsers } from "../../../services/users";

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

interface WholesalerUser {
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  default_role?: { role_name_key: string };
}

interface AdminCreateAuctionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
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

export default function AdminCreateAuctionForm({
  isOpen,
  onClose,
  onSuccess
}: AdminCreateAuctionFormProps) {
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
  const [customAuctionTitle, setCustomAuctionTitle] = useState<string>("");
  const [currentUserType, setCurrentUserType] = useState<string | null>(null);
  const [wholesalerUsers, setWholesalerUsers] = useState<WholesalerUser[]>([]);
  const [isLoadingWholesalers, setIsLoadingWholesalers] = useState(false);

  const fetchWholesalerUsers = useCallback(async () => {
    setIsLoadingWholesalers(true);
    try {
      const response = await readUsers();
      if (response.status !== 200) {
        throw new Error("فشل في جلب قائمة المستخدمين");
      }
      const data: WholesalerUser[] = response.data;
      const wholesalers =
        (data || []).filter(
          (u) => u.default_role?.role_name_key === "WHOLESALER",
        ) ?? [];
      setWholesalerUsers(wholesalers);
      if (!sellerUserId && wholesalers.length === 1) {
        setSellerUserId(wholesalers[0].user_id);
      }
    } catch {
      setError("فشل في جلب قائمة البائعين");
      setWholesalerUsers([]);
    } finally {
      setIsLoadingWholesalers(false);
    }
  }, [sellerUserId]);

  const fetchCurrentUser = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const response = await fetchAndStoreUserInfo();
      if (response.status !== 200) {
        throw new Error("فشل في جلب معلومات المستخدم الحالي");
      }
      const user = response.data as {
        user_id?: string;
        user_type?: { user_type_name_key?: string };
        default_role?: { role_name_key?: string };
      };
      const typeKey = user.user_type?.user_type_name_key ?? user.default_role?.role_name_key ?? null;
      setCurrentUserType(typeKey);
      if (typeKey === "WHOLESALER" && user.user_id) {
        setSellerUserId(user.user_id);
      } else {
        await fetchWholesalerUsers();
      }
    } catch {
      setError("فشل في جلب معلومات المستخدم الحالي");
      setSellerUserId("");
    } finally {
      setIsLoadingUser(false);
    }
  }, [fetchWholesalerUsers]);

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const response = await readAllProducts()
      if (response.status !== 200) throw new Error("فشل في جلب المنتجات");
      const data: Array<{
        product_id: string;
        seller_user_id?: string;
        translations?: Array<{ language_code: string; translated_product_name?: string }>;
      }> = response.data;
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
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSellerUserId("");
      setProductId("");
      setStartTimestamp(defaultStart());
      setEndTimestamp(defaultEnd());
      setAuctionTypeId("1");
      setAuctionStatusId("1");
      setStartingPricePerUnit("");
      setMinimumBidIncrement("1");
      setQuantityOffered("1");
      setUnitOfMeasureIdForQuantity("1");
      setCustomAuctionTitle("");
      fetchCurrentUser();
      fetchProducts();
    }
  }, [isOpen, fetchProducts]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sellerUserId) {
      setError(currentUserType === "WHOLESALER" ? "لم يتم تحديد البائع. تأكد من تسجيل الدخول." : "يرجى اختيار البائع (تاجر الجملة)");
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
      custom_auction_title: customAuctionTitle,
    };

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await createAuction(body)
      if (response.status !== 201) {
        throw new Error("فشل في إنشاء المزاد");
      }
      onClose();
      await onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في إنشاء المزاد");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl m-4">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-4">إنشاء مزاد جديد</h2>
        {error && (
          <div className="mb-4 p-3 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">{error}</div>
        )}
        {(isLoadingUser || isLoadingProducts) ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">جاري التحميل...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {currentUserType !== "WHOLESALER" && (
              <div>
                <Label htmlFor="seller_user_id">البائع (تاجر الجملة) <span className="text-error-500">*</span></Label>
                <select id="seller_user_id" value={sellerUserId} onChange={(e) => setSellerUserId(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4
                py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900
                dark:text-white/90 dark:focus:border-brand-800" required>
                  <option value="">{isLoadingWholesalers ? "جاري تحميل قائمة البائعين..." : "اختر البائع"}</option>
                  {wholesalerUsers.map((u) => (
                    <option key={u.user_id} value={u.user_id}>{u.first_name} {u.last_name} ({u.phone_number})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="product_id">المنتج <span className="text-error-500">*</span></Label>
              <select id="product_id" value={productId} onChange={(e) => setProductId(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5
              text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900
              dark:text-white/90 dark:focus:border-brand-800" required>
                <option value="">اختر المنتج</option>
                {products.map((p) => (
                  <option key={p.product_id} value={p.product_id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="custom_auction_title">عنوان المزاد</Label>
                <input id="custom_auction_title" type="text" value={customAuctionTitle} onChange={(e) => setCustomAuctionTitle(e.target.value)} className="h-11 w-full rounded-lg border
                border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10
                dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" required />
              </div>
              <div>
                <Label htmlFor="auction_type_id">نوع المزاد</Label>
                <select id="auction_type_id" value={auctionTypeId} onChange={(e) => setAuctionTypeId(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4
                py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900
                dark:text-white/90 dark:focus:border-brand-800">
                  {AUCTION_TYPES.map((t) => (
                    <option key={t.auction_type_id} value={String(t.auction_type_id)}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="start_timestamp">تاريخ ووقت البدء</Label>
                <input id="start_timestamp" type="datetime-local" value={startTimestamp} onChange={(e) => setStartTimestamp(e.target.value)} className="h-11 w-full rounded-lg border
                border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10
                dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" required />
              </div>
              <div>
                <Label htmlFor="end_timestamp">تاريخ ووقت الانتهاء</Label>
                <input id="end_timestamp" type="datetime-local" value={endTimestamp} onChange={(e) => setEndTimestamp(e.target.value)} className="h-11 w-full rounded-lg border border-gray-300
                bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700
                dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="starting_price_per_unit">السعر الابتدائي لكل وحدة (ر.س)</Label>
                <input id="starting_price_per_unit" type="number" step="0.01" min="0" value={startingPricePerUnit} onChange={(e) => setStartingPricePerUnit(e.target.value)} className="h-11 w-full
                rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3
                focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" required />
              </div>
              <div>
                <Label htmlFor="minimum_bid_increment">الحد الأدنى للزيادة (ر.س)</Label>
                <input id="minimum_bid_increment" type="number" step="0.01" min="0" value={minimumBidIncrement} onChange={(e) => setMinimumBidIncrement(e.target.value)} className="h-11 w-full
                rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3
                focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" required />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="quantity_offered">الكمية المعروضة</Label>
                <input id="quantity_offered" type="number" step="0.01" min="0.01" value={quantityOffered} onChange={(e) => setQuantityOffered(e.target.value)} className="h-11 w-full rounded-lg
                border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10
                dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" required />
              </div>
              <div>
                <Label htmlFor="unit_of_measure_id_for_quantity">وحدة القياس للكمية</Label>
                <select id="unit_of_measure_id_for_quantity" value={unitOfMeasureIdForQuantity} onChange={(e) => setUnitOfMeasureIdForQuantity(e.target.value)} className="h-11 w-full rounded-lg
                border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10
                dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
                  {UNITS_OF_MEASURE.map((u) => (
                    <option key={u.unit_id} value={String(u.unit_id)}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3
              text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-white/3 disabled:opacity-50">
                إلغاء
              </button>
              <button type="submit" disabled={isSubmitting || !productId} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm
              font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? "جاري الإنشاء..." : "إنشاء المزاد"}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
