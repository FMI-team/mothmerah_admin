"use client";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { ChangeEvent, SubmitEvent, useState } from "react";
import { useTranslations } from "../../../services/translate";
import { fetchAndStoreUserInfo, login } from "../../../services/auth";
import { getRole, setRole } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const { t } = useTranslations('ar');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState({
    'phone_number': '',
    'password': ''
  })
  const router = useRouter()

  function handleUserChange(event: ChangeEvent<HTMLInputElement>) {
    try {
      setUser((prevUser) => {
        return { ...prevUser, [event.target.name]: event.target.value}
      })
    } catch (error) {
      alert(error)
    }
  }

  async function handleOnSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setIsLoading(true)
      await login(user)
      const userInfo = await fetchAndStoreUserInfo()
      setRole(userInfo.user_type.user_type_name_key)
      if (getRole() === 'BASE_USER') {
        router.push('/base-user')
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md"> {t("auth.signIn.title")} </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400"> {t("auth.signIn.subtitle")} </p>
          </div>
          <div>
            <form onSubmit={handleOnSubmit}>
              <div className="space-y-6">
                {errorMsg && (
                  <div className="p-4 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg dark:bg-error-900/20 dark:text-error-400 dark:border-error-800">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <Label> {t("auth.signIn.phoneNumber")} <span className="text-error-500">*</span>{" "} </Label>
                  <Input placeholder={t("auth.signIn.enterPhoneNumber")} type="tel" defaultValue={user.phone_number} name="phone_number" onChange={handleUserChange} />
                </div>
                <div>
                  <Label> {t("auth.signIn.password")} <span className="text-error-500">*</span>{" "} </Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} placeholder={t("auth.signIn.enterPassword")} defaultValue={user.password} name="password" onChange={handleUserChange} />
                    <span onClick={() => setShowPassword(!showPassword)} className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2">
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>
                <div>
                  <Button className="w-full" size="sm" disabled={isLoading}> {isLoading ? t("auth.signIn.signingIn") : t("auth.signIn.signInButton")} </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
