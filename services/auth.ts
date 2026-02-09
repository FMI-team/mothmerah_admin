import api from "@/utils/api";
import { getToken, removeToken, setToken } from "@/utils/auth";

export async function login(user: { phone_number: string, password: string }) {
  const response = await api.post("api/v1/auth/login", user)
  setToken(response.data.access_token)
}

export async function fetchAndStoreUserInfo() {
  const response = await api.get("api/v1/users/me")
  return response;
}

export async function updateUserInfo(data: { first_name: string, last_name: string, email: string, phone_number: string }) {
  const response = await api.patch("api/v1/users/me", data)
  return response;
}

export function logout(redirectTo: string = "/signin"): void {
  removeToken();
  if (typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}