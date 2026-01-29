"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getAuthHeader } from "@/lib/auth";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Select from "../form/Select";
import Checkbox from "../form/input/Checkbox";

interface CategoryTranslation {
  language_code: string;
  translated_category_name?: string;
  translated_category_description?: string | null;
}

interface Category {
  category_name_key: string;
  category_id: number;
  is_active: boolean;
  translations: CategoryTranslation[];
}

interface ProductForEdit {
  product_id: string;
  category_id: number;
  country_of_origin_code: string | null;
  is_organic: boolean;
  is_local_saudi_product: boolean;
  main_image_url?: string | null;
  sku: string | null;
  tags?: unknown[];
  seller_user_id?: string;
  status: { product_status_id: number; status_name_key: string };
}

interface EditProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product: ProductForEdit | null;
}

const PRODUCT_STATUSES = [
  { product_status_id: 1, status_name_key: "DRAFT" },
  { product_status_id: 2, status_name_key: "ACTIVE" },
  { product_status_id: 3, status_name_key: "INACTIVE" },
  { product_status_id: 4, status_name_key: "DISCONTINUED" },
];

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "مسودة",
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  DISCONTINUED: "موقوفة",
};

const getArabicTranslation = (
  translations: CategoryTranslation[],
  field: "translated_category_name" | "translated_category_description"
): string => {
  const ar = translations.find((t) => t.language_code === "ar");
  return ar?.[field] || "";
};

export default function EditProductForm({
  isOpen,
  onClose,
  onSuccess,
  product,
}: EditProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [productData, setProductData] = useState<ProductForEdit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState<string>("");
  const [countryOfOriginCode, setCountryOfOriginCode] = useState<string>("");
  const [isOrganic, setIsOrganic] = useState(false);
  const [isLocalSaudiProduct, setIsLocalSaudiProduct] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [productStatusId, setProductStatusId] = useState<string>("");

  const fetchProduct = useCallback(async (productId: string) => {
    setIsLoadingProduct(true);
    setError(null);
    try {
      const authHeader = getAuthHeader();
      const res = await fetch(`https://api-testing.mothmerah.sa/api/v1/products/${productId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", ...authHeader },
      });
      if (!res.ok) throw new Error("فشل في جلب بيانات المنتج");
      const data = await res.json();
      setProductData(data as ProductForEdit);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في جلب بيانات المنتج");
      setProductData(null);
    } finally {
      setIsLoadingProduct(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const authHeader = getAuthHeader();
      const res = await fetch("https://api-testing.mothmerah.sa/api/v1/products/categories", {
        method: "GET",
        headers: { "Content-Type": "application/json", ...authHeader },
      });
      if (!res.ok) throw new Error("فشل في جلب الفئات");
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في جلب الفئات");
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (product?.product_id) {
        fetchProduct(product.product_id);
      } else {
        setProductData(null);
      }
    } else {
      setProductData(null);
    }
  }, [isOpen, product?.product_id, fetchCategories, fetchProduct]);

  useEffect(() => {
    const source = productData ?? product;
    if (source) {
      setCategoryId(String(source.category_id));
      setCountryOfOriginCode(source.country_of_origin_code ?? "");
      setIsOrganic(source.is_organic);
      setIsLocalSaudiProduct(source.is_local_saudi_product);
      setMainImageUrl(source.main_image_url ?? "");
      setSku(source.sku ?? "");
      setTags(Array.isArray(source.tags) ? (source.tags as string[]) : []);
      setProductStatusId(String(source.status.product_status_id));
      if (productData) setError(null);
    }
  }, [productData, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = productData ?? product;
    if (!targetProduct?.product_id) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const body: Record<string, unknown> = {
        category_id: parseInt(categoryId, 10),
        country_of_origin_code: countryOfOriginCode || "",
        is_organic: isOrganic,
        is_local_saudi_product: isLocalSaudiProduct,
        main_image_url: mainImageUrl || "",
        sku: sku || "",
        tags,
        product_status_id: parseInt(productStatusId, 10),
      };

      const authHeader = getAuthHeader();
      const res = await fetch(
        `https://api-testing.mothmerah.sa/api/v1/products/${targetProduct.product_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        let msg = "فشل في تحديث المنتج";
        if (errData.message && typeof errData.message === "string") {
          msg = errData.message;
        } else if (Array.isArray(errData.detail)) {
          const parts = errData.detail.map(
            (d: { loc?: unknown[]; msg?: string }) => {
              const loc = Array.isArray(d.loc) ? d.loc.join(".") : "";
              const m = typeof d.msg === "string" ? d.msg : "";
              return loc ? `${loc}: ${m}` : m;
            }
          );
          if (parts.length) msg = parts.join("; ");
        } else if (typeof errData.detail === "string") {
          msg = errData.detail;
        }
        throw new Error(msg);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ في تحديث المنتج");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories
    .filter((c) => c.is_active)
    .map((c) => ({
      value: String(c.category_id),
      label: getArabicTranslation(c.translations, "translated_category_name") || c.category_name_key,
    }));

  const statusOptions = PRODUCT_STATUSES.map((s) => ({
    value: String(s.product_status_id),
    label: STATUS_LABELS[s.status_name_key] ?? s.status_name_key,
  }));

  const displayProduct = productData ?? product;
  if (!displayProduct && !isLoadingProduct) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[600px] m-4">
      <div className="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            تعديل المنتج
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            تحديث معلومات المنتج
          </p>
        </div>

        {error && (
          <div className="mx-2 mb-4 rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
            {error}
          </div>
        )}

        {isLoadingProduct ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-500 dark:text-gray-400">
            جاري تحميل بيانات المنتج...
          </div>
        ) : (
        <form key={displayProduct?.product_id ?? "edit-form"} onSubmit={handleSubmit} className="flex flex-col">
          <div className="custom-scrollbar max-h-[70vh] overflow-y-auto px-2 pb-3">
            <div className="space-y-6">
              <div>
                <Label>الفئة <span className="text-error-500">*</span></Label>
                <Select
                  options={categoryOptions}
                  placeholder={isLoadingCategories ? "جاري التحميل..." : "اختر الفئة"}
                  onChange={setCategoryId}
                  defaultValue={categoryId}
                  className="dark:bg-dark-900"
                />
              </div>

              <div>
                <Label>رمز بلد المنشأ</Label>
                <input
                  type="text"
                  placeholder="مثال: SA"
                  value={countryOfOriginCode}
                  onChange={(e) => setCountryOfOriginCode(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isOrganic}
                    onChange={setIsOrganic}
                  />
                  <Label className="font-normal">منتج عضوي</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isLocalSaudiProduct}
                    onChange={setIsLocalSaudiProduct}
                  />
                  <Label className="font-normal">منتج سعودي محلي</Label>
                </div>
              </div>

              <div>
                <Label>رابط الصورة الرئيسية</Label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={mainImageUrl}
                  onChange={(e) => setMainImageUrl(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <Label>SKU</Label>
                <input
                  type="text"
                  placeholder="SKU"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <Label>الوسوم (مفصولة بفاصلة)</Label>
                <input
                  type="text"
                  placeholder="وسم1، وسم2"
                  value={tags.join(", ")}
                  onChange={(e) =>
                    setTags(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div>
                <Label>حالة المنتج <span className="text-error-500">*</span></Label>
                <Select
                  options={statusOptions}
                  placeholder="اختر الحالة"
                  onChange={setProductStatusId}
                  defaultValue={productStatusId}
                  className="dark:bg-dark-900"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 px-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 disabled:bg-brand-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
          </div>
        </form>
        )}
      </div>
    </Modal>
  );
}
