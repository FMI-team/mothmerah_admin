
'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getRole, getToken } from "../utils/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/signin");
      return;
    }
    if (getToken() && getRole() === "BASE_USER") {
      router.push("/base-user");
    }
  }, [router]);

  return null;
}