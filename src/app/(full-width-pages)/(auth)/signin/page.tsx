import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "مثمرة | تسجيل الدخول",
  description: "تسجيل الدخول إلى موقع مثمرة",
};

export default function SignIn() {
  return <SignInForm />;
}
