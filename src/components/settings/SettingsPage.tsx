"use client";
import React, { useState, useEffect } from "react";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import Switch from "../form/switch/Switch";
import { getAuthHeader } from "@/lib/auth";

interface UserData {
  phone_number: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  default_user_role_id: number;
  user_verification_status_id: number;
  preferred_language_code: string;
  user_id: string;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  last_login_timestamp: string | null;
  last_activity_timestamp: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  updated_by_user_id: string | null;
  additional_data: unknown | null;
  account_status: {
    status_name_key: string;
    is_terminal: boolean;
    account_status_id: number;
    translations: unknown[];
  };
  user_type: {
    user_type_name_key: string;
    user_type_id: number;
    translations: unknown[];
  };
  default_role: {
    role_name_key: string;
    is_active: boolean;
    role_id: number;
    created_at: string;
    updated_at: string;
    translations: unknown[];
  };
  user_verification_status: {
    status_name_key: string;
    description_key: string;
    user_verification_status_id: number;
    created_at: string;
    updated_at: string;
    translations: unknown[];
  };
  preferred_language: {
    language_code: string;
    language_name_native: string;
    language_name_en: string;
    text_direction: string;
    is_active_for_interface: boolean;
    sort_order: number;
    created_at: string;
  };
}

export default function SettingsPage() {
  const [platformName, setPlatformName] = useState("تطبيق مثمرة");
  const [contactEmail, setContactEmail] = useState("example@gmail.com");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [userReviewsEnabled, setUserReviewsEnabled] = useState(true);
  const [isSavingBasic, setIsSavingBasic] = useState(false);
  const [isSavingFeatures, setIsSavingFeatures] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const authHeader = getAuthHeader();
        const response = await fetch("http://127.0.0.1:8000/api/v1/users/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data: UserData[] | UserData = await response.json();
        
        // Handle both array and single object responses
        const user = Array.isArray(data) ? data[0] : data;
        
        if (user) {
          setUserData(user);
          // Use user email as contact email if available
          if (user.email) {
            setContactEmail(user.email);
          }
          // Use profile picture as logo preview if available
          if (user.profile_picture_url) {
            setLogoPreview(user.profile_picture_url);
          }
          // You can also use user.first_name and user.last_name for platform name if needed
          // if (user.first_name && user.last_name) {
          //   setPlatformName(`${user.first_name} ${user.last_name}`);
          // }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "حدث خطأ في جلب البيانات"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBasicInfo = async () => {
    setIsSavingBasic(true);
    setError(null);

    try {
      const authHeader = getAuthHeader();
      const response = await fetch("http://127.0.0.1:8000/api/v1/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
        body: JSON.stringify({
          email: contactEmail,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle validation errors
        if (errorData.detail && Array.isArray(errorData.detail)) {
          const errorMessages = errorData.detail
            .map((err: { msg: string; loc: string[] }) => err.msg)
            .join(", ");
          throw new Error(errorMessages || "فشل في تحديث البيانات");
        }
        
        throw new Error(
          errorData.message ||
            errorData.detail ||
            "فشل في تحديث البيانات"
        );
      }

      const updatedData: UserData[] | UserData = await response.json();
      const updatedUser = Array.isArray(updatedData) ? updatedData[0] : updatedData;
      
      if (updatedUser) {
        setUserData(updatedUser);
        setContactEmail(updatedUser.email);
      }

      // Show success message (you can replace this with a toast notification)
      setError(null);
      alert("تم حفظ التغييرات بنجاح");
    } catch (err) {
      console.error("Error updating user data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ أثناء حفظ التغييرات"
      );
    } finally {
      setIsSavingBasic(false);
    }
  };

  const handleSaveFeatures = async () => {
    setIsSavingFeatures(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSavingFeatures(false);
    alert("تم حفظ التغييرات بنجاح");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">
          الاعدادات العامة
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          تحديث التكوينات والاعدادات العامة للمنصة
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-sm text-error-600 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            جاري التحميل...
          </div>
        </div>
      )}

      {/* Basic Information Section */}
      {!isLoading && (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            المعلومات الاساسية
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            تحديث اسم المنصة والبريد الالكتروني والشعار
          </p>
        </div>

        <div className="space-y-5">
          {/* Platform Name */}
          <div>
            <Label htmlFor="platform-name">اسم المنصة</Label>
            <input
              id="platform-name"
              type="text"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              placeholder="أدخل اسم المنصة"
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>

          {/* Contact Email */}
          <div>
            <Label htmlFor="contact-email">البريد الالكتروني للتواصل</Label>
            <input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="example@email.com"
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:focus:border-brand-800"
            />
          </div>

          {/* Platform Logo */}
          <div>
            <Label>شعار المنصة</Label>
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-purple-50 dark:border-gray-700 dark:bg-purple-900/20">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Platform Logo"
                      className="h-full w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <svg
                        className="h-12 w-12 text-purple-500 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-purple-100 px-4 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  تحميل جديد
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              size="sm"
              onClick={handleSaveBasicInfo}
              disabled={isSavingBasic}
            >
              {isSavingBasic ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* Platform Features Section */}
      {!isLoading && (
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/3 sm:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            ميزات المنصة
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            تمكين او تعطيل الميزات الرئيسية على المنصة
          </p>
        </div>

        <div className="space-y-6">
          {/* User Reviews Toggle */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex-1">
              <div className="mb-2">
                <Switch
                  label="تمكين مراجعات المستخدمين"
                  defaultChecked={userReviewsEnabled}
                  onChange={setUserReviewsEnabled}
                  color="green"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                السماح للمستخدمين بترك مراجعات على المنتجات
              </p>
            </div>
          </div>

          {/* Additional Feature Toggle Example */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex-1">
              <div className="mb-2">
                <Switch
                  label="تمكين الإشعارات"
                  defaultChecked={false}
                  color="green"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                إرسال إشعارات للمستخدمين حول التحديثات والعروض
              </p>
            </div>
          </div>

          {/* Another Feature Toggle */}
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex-1">
              <div className="mb-2">
                <Switch
                  label="تمكين نظام التقييمات"
                  defaultChecked={true}
                  color="green"
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                السماح للمستخدمين بتقييم المنتجات والخدمات
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4">
            <Button
              size="sm"
              onClick={handleSaveFeatures}
              disabled={isSavingFeatures}
            >
              {isSavingFeatures ? "جاري الحفظ..." : "حفظ التغييرات"}
            </Button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

