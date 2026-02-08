import api from "@/utils/api";
import { getToken, removeToken, setToken } from "@/utils/auth";

export async function login(user: { phone_number: string, password: string }) {
  const response = await api.post("api/v1/auth/login", user)
  setToken(response.data.access_token)
}

export async function fetchAndStoreUserInfo() {
  const response = await api.get("api/v1/users/me")
  return response.data;
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