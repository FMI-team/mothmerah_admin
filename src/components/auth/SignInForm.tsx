"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { storeAuthTokens, fetchAndStoreUserInfo } from "@/lib/auth";
import { useTranslations } from "@/lib/translations";

export default function SignInForm() {
  const router = useRouter();
  const { t } = useTranslations('ar');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("https://api-testing.mothmerah.sa/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message ||
          data.error ||
          data.detail ||
          t("auth.signIn.errors.loginFailed");
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.access_token) {
        storeAuthTokens({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_type: data.token_type,
        });

        try {
          const userType = await fetchAndStoreUserInfo();

          if (userType === "WHOLESALER" || userType === "wholesaler") {
            router.push("/wholesaler");
          } else if (userType === "FARMER" || userType === "farmer") {
            router.push("/farmer");
          } else if (userType === "COMMERCIAL_BUYER" || userType === "commercial_buyer" || userType === "COMMERCIALBUYER" || userType === "commercialBuyer") {
            router.push("/commercial-buyer");
          } else if (userType === "BASE_USER" || userType === "base_user" || userType === "BASEUSER" || userType === "baseUser") {
            router.push("/base-user");
          } else {
            router.push("/");
          }
        } catch {
          router.push("/");
        }
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("auth.signIn.errors.errorOccurred")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {t("auth.signIn.title")}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("auth.signIn.subtitle")}
            </p>
          </div>
          <div>
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {error && (
                  <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
                    {error}
                  </div>
                )}
                <div>
                  <Label>
                    {t("auth.signIn.phoneNumber")} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    placeholder={t("auth.signIn.enterPhoneNumber")}
                    type="tel"
                    defaultValue={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setError(null);
                    }} />
                </div>
                <div>
                  <Label>
                    {t("auth.signIn.password")} <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.signIn.enterPassword")}
                      defaultValue={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox checked={isChecked} onChange={setIsChecked} />
                    <span className="block font-normal text-gray-700 text-theme-sm dark:text-gray-400">
                      {t("auth.signIn.keepMeLoggedIn")}
                    </span>
                  </div>
                  <a
                    href="/reset-password"
                    className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    {t("auth.signIn.forgotPassword")}
                  </a>
                </div>
                <div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={isLoading || !phoneNumber || !password}
                  >
                    {isLoading ? t("auth.signIn.signingIn") : t("auth.signIn.signInButton")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
