"use client";
import React, { useState, useEffect, useCallback } from "react";
import { getAuthHeader } from "@/lib/auth";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
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
  parent_category_id: number;
  category_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  category_id: number;
  translations: CategoryTranslation[];
}

interface UnitOfMeasure {
  unit_id: number;
  unit_name_key: string;
  unit_abbreviation_key: string;
}

const UNITS_OF_MEASURE: UnitOfMeasure[] = [
  { unit_id: 1, unit_name_key: "KILOGRAM", unit_abbreviation_key: "kg" },
  { unit_id: 2, unit_name_key: "BOX", unit_abbreviation_key: "box" },
  { unit_id: 3, unit_name_key: "BUNCH", unit_abbreviation_key: "bunch" },
];

interface CreateProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called with the created product from the API response, if any */
  onSuccess?: (createdProduct?: unknown) => void | Promise<void>;
}

interface TranslationFormData {
  language_code: string;
  translated_product_name: string;
  translated_description: string;
  translated_short_description: string;
}

interface PackagingOptionTranslation {
  language_code: string;
  translated_packaging_option_name: string;
  translated_custom_description: string;
}

interface PackagingOptionFormData {
  quantity_in_packaging: string;
  unit_of_measure_id_for_quantity: string;
  base_price: string;
  sku: string;
  barcode: string;
  is_default_option: boolean;
  is_active: boolean;
  sort_order: string;
  translations: PackagingOptionTranslation[];
}

const getArabicTranslation = (
  translations: CategoryTranslation[],
  field: "translated_category_name" | "translated_category_description"
): string => {
  const arabicTranslation = translations.find((t) => t.language_code === "ar");
  return arabicTranslation?.[field] || "";
};

export default function CreateProductForm({
  isOpen,
  onClose,
  onSuccess,
}: CreateProductFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [categoryId, setCategoryId] = useState<string>("");
  const [basePricePerUnit, setBasePricePerUnit] = useState<string>("");
  const [unitOfMeasureId, setUnitOfMeasureId] = useState<string>("");
  const [countryOfOriginCode, setCountryOfOriginCode] = useState<string>("");
  const [isOrganic, setIsOrganic] = useState(false);
  const [isLocalSaudiProduct, setIsLocalSaudiProduct] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<string>("");
  const [sku, setSku] = useState<string>("");
  // seller_user_id سيكون دائماً هو المستخدم الحالي
  const [sellerUserId, setSellerUserId] = useState<string>("");

  const [translationsData, setTranslationsData] = useState<TranslationFormData[]>([
    { language_code: "ar", translated_product_name: "", translated_description: "", translated_short_description: "" },
    { language_code: "en", translated_product_name: "", translated_description: "", translated_short_description: "" },
  ]);

  const [packagingOptionsData, setPackagingOptionsData] = useState<PackagingOptionFormData[]>([
    {
      quantity_in_packaging: "",
      unit_of_measure_id_for_quantity: "",
      base_price: "",
      sku: "",
      barcode: "",
      is_default_option: true,
      is_active: true,
      sort_order: "1",
      translations: [
        { language_code: "ar", translated_packaging_option_name: "", translated_custom_description: "" },
        { language_code: "en", translated_packaging_option_name: "", translated_custom_description: "" },
      ],
    },
  ]);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/products/categories", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      if (!response.ok) {
        throw new Error("فشل في جلب الفئات");
      }

      const data: Category[] = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        err instanceof Error ? err.message : "حدث خطأ في جلب الفئات"
      );
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/users/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch current user for seller_user_id");
        return;
      }

      const data = await response.json();
      if (data?.user_id) {
        setSellerUserId(data.user_id);
      }
    } catch (err) {
      console.error("Error fetching current user for seller_user_id:", err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchCurrentUser();
    }
  }, [isOpen, fetchCategories, fetchCurrentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("يرجى اختيار الفئة");
      return;
    }

    const hasValidTranslations = translationsData.some(
      (t) =>
        t.translated_product_name &&
        t.translated_description &&
        t.translated_short_description
    );
    if (!hasValidTranslations) {
      setError("يرجى إدخال الترجمات (اسم المنتج، الوصف، والوصف المختصر)");
      return;
    }

    // Validate packaging options
    const hasValidPackaging = packagingOptionsData.some(
      (p) =>
        p.quantity_in_packaging &&
        p.unit_of_measure_id_for_quantity &&
        p.base_price
    );
    if (!hasValidPackaging) {
      setError("يرجى إدخال خيارات التعبئة (الكمية، وحدة القياس، والسعر)");
      return;
    }

    // seller_user_id هو المستخدم الحالي
    if (!sellerUserId) {
      setError(
        "تعذّر تحديد معرف المستخدم الحالي، يرجى إعادة تحميل الصفحة ثم المحاولة مرة أخرى."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const validatedTranslations = translationsData.filter(
        (t) =>
          t.translated_product_name ||
          t.translated_description ||
          t.translated_short_description
      );

      const validatedPackagingOptions = packagingOptionsData.map((pkg) => ({
        quantity_in_packaging: parseFloat(pkg.quantity_in_packaging) || 0,
        unit_of_measure_id_for_quantity:
          parseInt(pkg.unit_of_measure_id_for_quantity, 10) || 0,
        base_price: parseFloat(pkg.base_price) || 0,
        sku: pkg.sku || null,
        barcode: pkg.barcode || null,
        is_default_option: pkg.is_default_option,
        is_active: pkg.is_active,
        sort_order: parseInt(pkg.sort_order, 10) || 0,
        translations: pkg.translations.filter(
          (tr) =>
            tr.translated_packaging_option_name ||
            tr.translated_custom_description
        ),
      }));

      const formData = new FormData();

      formData.append("category_id", categoryId);
      formData.append("seller_user_id", sellerUserId);
      formData.append("translations", JSON.stringify(validatedTranslations));
      formData.append(
        "packaging_options",
        JSON.stringify(validatedPackagingOptions)
      );
      formData.append("is_organic", String(isOrganic));
      formData.append("is_local_saudi_product", String(isLocalSaudiProduct));

      if (basePricePerUnit) {
        formData.append("base_price_per_unit", basePricePerUnit);
      }
      if (unitOfMeasureId) {
        formData.append("unit_of_measure_id", unitOfMeasureId);
      }
      if (countryOfOriginCode) {
        formData.append("country_of_origin_code", countryOfOriginCode);
      }
      if (mainImageUrl) {
        formData.append("main_image_url", mainImageUrl);
      }
      if (sku) {
        formData.append("sku", sku);
      }

      const authHeader = getAuthHeader();
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/products/", {
        method: "POST",
        headers: {
          ...authHeader,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = "فشل في إنشاء المنتج";
        if (errorData.message && typeof errorData.message === "string") {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            const parts = errorData.detail.map(
              (d: { loc?: unknown[]; msg?: string }) => {
                const loc = Array.isArray(d.loc) ? d.loc.join(".") : "";
                const msg = typeof d.msg === "string" ? d.msg : "";
                return loc ? `${loc}: ${msg}` : msg;
              }
            );
            errorMessage = parts.length > 0 ? parts.join("; ") : errorMessage;
          } else if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail;
          }
        }
        throw new Error(errorMessage);
      }

      const createdProduct = await response.json().catch(() => undefined);

      // Reset form
      setCategoryId("");
      setBasePricePerUnit("");
      setUnitOfMeasureId("");
      setCountryOfOriginCode("");
      setIsOrganic(false);
      setIsLocalSaudiProduct(false);
      setMainImageUrl("");
      setSku("");
      setSellerUserId("");
      setTranslationsData([
        {
          language_code: "ar",
          translated_product_name: "",
          translated_description: "",
          translated_short_description: "",
        },
        {
          language_code: "en",
          translated_product_name: "",
          translated_description: "",
          translated_short_description: "",
        },
      ]);
      setPackagingOptionsData([
        {
          quantity_in_packaging: "",
          unit_of_measure_id_for_quantity: "",
          base_price: "",
          sku: "",
          barcode: "",
          is_default_option: true,
          is_active: true,
          sort_order: "1",
          translations: [
            {
              language_code: "ar",
              translated_packaging_option_name: "",
              translated_custom_description: "",
            },
            {
              language_code: "en",
              translated_packaging_option_name: "",
              translated_custom_description: "",
            },
          ],
        },
      ]);

      await Promise.resolve(onSuccess?.(createdProduct));
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "حدث خطأ في إنشاء المنتج"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = categories
    .filter((cat) => cat.is_active)
    .map((cat) => {
      const categoryName = getArabicTranslation(
        cat.translations,
        "translated_category_name"
      ) || cat.category_name_key;
      return {
        value: cat.category_id.toString(),
        label: categoryName,
      };
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] m-4">
      <div className="no-scrollbar relative w-full max-w-[800px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            إنشاء منتج جديد
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            املأ المعلومات التالية لإنشاء منتج جديد
          </p>
        </div>

        {error && (
          <div className="mx-2 mb-4 p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="custom-scrollbar h-[800px] overflow-y-auto px-2 pb-3">
            <div className="space-y-6">
              <div>
                <Label>
                  الفئة <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Select
                    options={categoryOptions}
                    placeholder={isLoadingCategories ? "جاري التحميل..." : "اختر الفئة"}
                    onChange={(value) => setCategoryId(value)}
                    defaultValue={categoryId}
                    className="dark:bg-dark-900"
                  />
                </div>
              </div>

              {/* Base Price Per Unit */}
              <div>
                <Label>السعر الأساسي لكل وحدة</Label>
                <Input
                  type="number"
                  step={0.01}
                  placeholder="0.00"
                  defaultValue={basePricePerUnit}
                  onChange={(e) => setBasePricePerUnit(e.target.value)}
                />
              </div>

              {/* Unit of Measure */}
              <div>
                <Label>وحدة القياس</Label>
                <div className="relative">
                  <Select
                    options={UNITS_OF_MEASURE.map((unit: UnitOfMeasure) => ({
                      value: unit.unit_id.toString(),
                      label: `${unit.unit_name_key} (${unit.unit_abbreviation_key})`,
                    }))}
                    placeholder="اختر وحدة القياس"
                    onChange={(value) => setUnitOfMeasureId(value)}
                    defaultValue={unitOfMeasureId}
                    className="dark:bg-dark-900"
                  />
                </div>
              </div>

              {/* Country of Origin Code */}
              <div>
                <Label>رمز بلد المنشأ</Label>
                <Input
                  type="text"
                  placeholder="مثال: SA"
                  defaultValue={countryOfOriginCode}
                  onChange={(e) => setCountryOfOriginCode(e.target.value)}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isOrganic}
                    onChange={setIsOrganic}
                  />
                  <Label className="mb-0">منتج عضوي</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isLocalSaudiProduct}
                    onChange={setIsLocalSaudiProduct}
                  />
                  <Label className="mb-0">منتج سعودي محلي</Label>
                </div>
              </div>

              {/* Main Image URL */}
              <div>
                <Label>رابط الصورة الرئيسية</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  defaultValue={mainImageUrl}
                  onChange={(e) => setMainImageUrl(e.target.value)}
                />
              </div>

              {/* SKU */}
              <div>
                <Label>رمز المنتج (SKU)</Label>
                <Input
                  type="text"
                  placeholder="SKU-12345"
                  defaultValue={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <Label>
                  الترجمات <span className="text-error-500">*</span>
                </Label>
                {translationsData.map((translation, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-3 flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {translation.language_code === "ar" ? "العربية" : "English"}
                      </h5>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {translation.language_code.toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">اسم المنتج *</Label>
                        <input
                          type="text"
                          placeholder={translation.language_code === "ar" ? "طماطم عضوية طازجة" : "Fresh Organic Tomatoes"}
                          value={translation.translated_product_name}
                          onChange={(e) => {
                            const updated = [...translationsData];
                            updated[index].translated_product_name = e.target.value;
                            setTranslationsData(updated);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">الوصف *</Label>
                        <textarea
                          className="h-20 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                          placeholder={translation.language_code === "ar" ? "طماطم عضوية طازجة من المزارع المحلية السعودية، خالية من المبيدات" : "Fresh organic tomatoes from local Saudi farms, pesticide-free"}
                          value={translation.translated_description}
                          onChange={(e) => {
                            const updated = [...translationsData];
                            updated[index].translated_description = e.target.value;
                            setTranslationsData(updated);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">الوصف المختصر *</Label>
                        <input
                          type="text"
                          placeholder={translation.language_code === "ar" ? "طماطم عضوية طازجة" : "Fresh organic tomatoes"}
                          value={translation.translated_short_description}
                          onChange={(e) => {
                            const updated = [...translationsData];
                            updated[index].translated_short_description = e.target.value;
                            setTranslationsData(updated);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>
                    خيارات التعبئة <span className="text-error-500">*</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setPackagingOptionsData([
                        ...packagingOptionsData,
                        {
                          quantity_in_packaging: "",
                          unit_of_measure_id_for_quantity: "",
                          base_price: "",
                          sku: "",
                          barcode: "",
                          is_default_option: false,
                          is_active: true,
                          sort_order: String(packagingOptionsData.length + 1),
                          translations: [
                            { language_code: "ar", translated_packaging_option_name: "", translated_custom_description: "" },
                            { language_code: "en", translated_packaging_option_name: "", translated_custom_description: "" },
                          ],
                        },
                      ]);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    + إضافة خيار تعبئة
                  </button>
                </div>
                {packagingOptionsData.map((pkg, pkgIndex) => (
                  <div key={pkgIndex} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                    <div className="mb-4 flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        خيار التعبئة #{pkgIndex + 1}
                      </h5>
                      {packagingOptionsData.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setPackagingOptionsData(packagingOptionsData.filter((_, i) => i !== pkgIndex));
                          }}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-error-300 bg-white px-3 py-1.5 text-xs font-medium text-error-500 shadow-theme-xs hover:bg-error-50 dark:border-error-700 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-error-900/20"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <Label className="text-xs">الكمية في العبوة *</Label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="1.0"
                          value={pkg.quantity_in_packaging}
                          onChange={(e) => {
                            const updated = [...packagingOptionsData];
                            updated[pkgIndex].quantity_in_packaging = e.target.value;
                            setPackagingOptionsData(updated);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">وحدة القياس للكمية *</Label>
                        <Select
                          options={UNITS_OF_MEASURE.map((unit) => ({
                            value: unit.unit_id.toString(),
                            label: `${unit.unit_name_key} (${unit.unit_abbreviation_key})`,
                          }))}
                          placeholder="اختر وحدة القياس"
                          onChange={(value) => {
                            const updated = [...packagingOptionsData];
                            updated[pkgIndex].unit_of_measure_id_for_quantity = value;
                            setPackagingOptionsData(updated);
                          }}
                          defaultValue={pkg.unit_of_measure_id_for_quantity}
                          className="dark:bg-dark-900"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">السعر الأساسي *</Label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="25.5"
                          value={pkg.base_price}
                          onChange={(e) => {
                            const updated = [...packagingOptionsData];
                            updated[pkgIndex].base_price = e.target.value;
                            setPackagingOptionsData(updated);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ترتيب العرض</Label>
                        <input
                          type="number"
                          placeholder="1"
                          value={pkg.sort_order}
                          onChange={(e) => {
                            const updated = [...packagingOptionsData];
                            updated[pkgIndex].sort_order = e.target.value;
                            setPackagingOptionsData(updated);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">SKU</Label>
                        <input
                          type="text"
                          placeholder="PKG-001-1KG"
                          value={pkg.sku}
                          onChange={(e) => {
                            const updated = [...packagingOptionsData];
                            updated[pkgIndex].sku = e.target.value;
                            setPackagingOptionsData(updated);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">الباركود</Label>
                        <input
                          type="text"
                          placeholder="1234567890123"
                          value={pkg.barcode}
                          onChange={(e) => {
                            const updated = [...packagingOptionsData];
                            updated[pkgIndex].barcode = e.target.value;
                            setPackagingOptionsData(updated);
                          }}
                          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={pkg.is_default_option}
                          onChange={(checked) => {
                            const updated = [...packagingOptionsData];
                            // Only one can be default
                            if (checked) {
                              updated.forEach((p, i) => {
                                if (i !== pkgIndex) p.is_default_option = false;
                              });
                            }
                            updated[pkgIndex].is_default_option = checked;
                            setPackagingOptionsData(updated);
                          }}
                        />
                        <Label className="mb-0 text-xs">الخيار الافتراضي</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={pkg.is_active}
                          onChange={(checked) => {
                            const updated = [...packagingOptionsData];
                            updated[pkgIndex].is_active = checked;
                            setPackagingOptionsData(updated);
                          }}
                        />
                        <Label className="mb-0 text-xs">نشط</Label>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <Label className="text-xs">الترجمات</Label>
                      {pkg.translations.map((translation, transIndex) => (
                        <div key={transIndex} className="rounded border border-gray-200 p-3 dark:border-gray-700">
                          <div className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                            {translation.language_code === "ar" ? "العربية" : "English"}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">اسم خيار التعبئة *</Label>
                              <input
                                required
                                type="text"
                                placeholder={translation.language_code === "ar" ? "كيلوغرام واحد" : "One Kilogram"}
                                value={translation.translated_packaging_option_name}
                                onChange={(e) => {
                                  const updated = [...packagingOptionsData];
                                  updated[pkgIndex].translations[transIndex].translated_packaging_option_name = e.target.value;
                                  setPackagingOptionsData(updated);
                                }}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">الوصف المخصص</Label>
                              <input
                                type="text"
                                placeholder={translation.language_code === "ar" ? "عبوة واحدة كيلوغرام" : "Single 1kg package"}
                                value={translation.translated_custom_description}
                                onChange={(e) => {
                                  const updated = [...packagingOptionsData];
                                  updated[pkgIndex].translations[transIndex].translated_custom_description = e.target.value;
                                  setPackagingOptionsData(updated);
                                }}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              إلغاء
            </Button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "جاري الإنشاء..." : "إنشاء المنتج"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

