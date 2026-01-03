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
  onSuccess?: () => void;
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
  const [tags, setTags] = useState<string>("");
  const [translations, setTranslations] = useState<string>("");
  const [packagingOptions, setPackagingOptions] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const authHeader = getAuthHeader();
      const response = await fetch("http://127.0.0.1:8000/api/v1/categories", {
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

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  // Helper function to fix common JSON issues (single quotes to double quotes)
  const fixJsonString = (jsonString: string): string => {
    // Replace single quotes with double quotes, but be careful with apostrophes in strings
    // This is a simple approach - replace single quotes that are likely JSON property delimiters
    // Pattern: single quote followed by optional whitespace, colon, or comma
    const fixed = jsonString
      .replace(/'(\s*:)/g, '"$1') // property names: 'key': -> "key":
      .replace(/(:\s*)'/g, '$1"') // property values: : 'value' -> : "value"
      .replace(/(,\s*)'/g, '$1"') // array/object items: , 'item' -> , "item"
      .replace(/^'/g, '"') // start of string
      .replace(/'$/g, '"') // end of string
      .replace(/'(\s*[,}\]])/g, '"$1') // before closing brackets
      .replace(/([{,\[\s])'/g, '$1"'); // after opening brackets or commas
    
    return fixed;
  };

  // Helper function to remove trailing commas from JSON
  const removeTrailingCommas = (jsonString: string): string => {
    // Remove trailing commas before closing brackets/braces
    return jsonString
      .replace(/,(\s*[}\]])/g, '$1') // Remove comma before } or ]
      .replace(/,(\s*$)/gm, ''); // Remove trailing commas at end of lines
  };

  // Helper function to add missing commas between properties
  const addMissingCommas = (jsonString: string): string => {
    // Pattern: closing quote followed by whitespace/newline and then opening quote (property value to next property name)
    // Also handle: closing quote followed by whitespace and closing brace (last property)
    // Also handle: closing bracket/brace followed by whitespace and opening quote (array/object item to next property)
    const fixed = jsonString
      // Add comma between property value and next property name: "value"\n"key" -> "value",\n"key"
      // Match: closing quote, optional whitespace/newlines, opening quote followed by letter (property name)
      .replace(/"(\s+)"([a-zA-Z_][a-zA-Z0-9_]*)/g, '"$1, "$2')
      // Add comma between property value and closing brace: "value"\n} -> "value",\n}
      .replace(/"(\s+)}/g, '"$1, }')
      // Add comma between closing bracket/brace and opening quote: ]\n"key" -> ],\n"key"
      .replace(/([\]}])(\s+)"([a-zA-Z_][a-zA-Z0-9_]*)/g, '$1$2, "$3')
      // Add comma between closing bracket/brace and opening brace: ]\n{ -> ],\n{
      .replace(/([\]}])(\s+){/g, '$1$2, {');
    
    return fixed;
  };

  // Helper function to validate and parse JSON
  const validateAndParseJson = (jsonString: string, fieldName: string): string => {
    if (!jsonString.trim()) {
      throw new Error(`يرجى إدخال ${fieldName}`);
    }

    let cleaned = jsonString.trim();

    try {
      // Try parsing as-is first
      JSON.parse(cleaned);
      return cleaned;
    } catch {
      // If it fails, try fixing common issues
      try {
        // First, try removing trailing commas
        cleaned = removeTrailingCommas(cleaned);
        JSON.parse(cleaned);
        return cleaned;
      } catch {
        // If that fails, try adding missing commas
        try {
          cleaned = addMissingCommas(cleaned);
          cleaned = removeTrailingCommas(cleaned);
          JSON.parse(cleaned);
          return cleaned;
        } catch {
          // If that fails, try fixing single quotes
          try {
            const fixed = fixJsonString(cleaned);
            const fixedWithCommas = addMissingCommas(fixed);
            const fixedNoTrailing = removeTrailingCommas(fixedWithCommas);
            JSON.parse(fixedNoTrailing);
            return fixedNoTrailing;
          } catch (parseError) {
            const errorMsg = parseError instanceof Error ? parseError.message : 'خطأ في JSON';
            throw new Error(`${fieldName} غير صحيح: ${errorMsg}. تأكد من: 1) استخدام علامات التنصيص المزدوجة " وليس ' 2) إضافة فواصل بين الخصائص 3) عدم وجود فواصل زائدة قبل } أو ]`);
          }
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("يرجى اختيار الفئة");
      return;
    }

    if (!translations) {
      setError("يرجى إدخال الترجمات (JSON)");
      return;
    }

    if (!packagingOptions) {
      setError("يرجى إدخال خيارات التعبئة (JSON)");
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate and fix JSON strings
      const validatedTranslations = validateAndParseJson(translations, "الترجمات");
      const validatedPackagingOptions = validateAndParseJson(packagingOptions, "خيارات التعبئة");

      const authHeader = getAuthHeader();
      const formData = new FormData();

      // Required fields
      formData.append("category_id", categoryId);
      formData.append("translations", validatedTranslations);
      formData.append("packaging_options", validatedPackagingOptions);

      // Optional fields
      if (basePricePerUnit) {
        formData.append("base_price_per_unit", basePricePerUnit);
      }
      if (unitOfMeasureId) {
        formData.append("unit_of_measure_id", unitOfMeasureId);
      }
      if (countryOfOriginCode) {
        formData.append("country_of_origin_code", countryOfOriginCode);
      }
      formData.append("is_organic", isOrganic.toString());
      formData.append("is_local_saudi_product", isLocalSaudiProduct.toString());
      if (mainImageUrl) {
        formData.append("main_image_url", mainImageUrl);
      }
      if (sku) {
        formData.append("sku", sku);
      }
      if (tags) {
        formData.append("tags", tags);
      }
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch("http://127.0.0.1:8000/api/v1", {
        method: "POST",
        headers: {
          ...authHeader,
          // Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.detail || "فشل في إنشاء المنتج"
        );
      }

      // Reset form
      setCategoryId("");
      setBasePricePerUnit("");
      setUnitOfMeasureId("");
      setCountryOfOriginCode("");
      setIsOrganic(false);
      setIsLocalSaudiProduct(false);
      setMainImageUrl("");
      setSku("");
      setTags("");
      setTranslations("");
      setPackagingOptions("");
      setImage(null);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error creating product:", err);
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
          <div className="custom-scrollbar h-[600px] overflow-y-auto px-2 pb-3">
            <div className="space-y-6">
              {/* Category (Required) */}
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

              {/* Tags */}
              <div>
                <Label>العلامات (مفصولة بفواصل)</Label>
                <Input
                  type="text"
                  placeholder="خضروات, طازج, عضوي"
                  defaultValue={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>

              {/* Translations (Required) */}
              <div>
                <Label>
                  الترجمات (JSON) <span className="text-error-500">*</span>
                </Label>
                <textarea
                  className="h-32 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 font-mono"
                  placeholder='[{"language_code": "ar", "translated_product_name": "اسم المنتج", "translated_description": "وصف المنتج"}]'
                  value={translations}
                  onChange={(e) => setTranslations(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ملاحظة: استخدم علامات التنصيص المزدوجة &quot; وليس &apos;
                </p>
              </div>

              {/* Packaging Options (Required) */}
              <div>
                <Label>
                  خيارات التعبئة (JSON) <span className="text-error-500">*</span>
                </Label>
                <textarea
                  className="h-32 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 font-mono"
                  placeholder='[{"packaging_option_name_key": "default", "quantity_in_packaging": 1, "base_price": 10.00}]'
                  value={packagingOptions}
                  onChange={(e) => setPackagingOptions(e.target.value)}
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ملاحظة: استخدم علامات التنصيص المزدوجة &quot; وليس &apos;
                </p>
              </div>

              {/* Image Upload */}
              <div>
                <Label>رفع صورة</Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                {image && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    الملف المحدد: {image.name}
                  </p>
                )}
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

