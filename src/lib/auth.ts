/**
 * Authentication utility functions
 */

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at?: number; // Unix timestamp when token expires
}

interface DecodedToken {
  exp?: number; // Expiration time (Unix timestamp)
  iat?: number; // Issued at time
  [key: string]: string | number | undefined;
}

/**
 * Cookie utility functions
 */
function setCookie(name: string, value: string, expiresAt: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date(expiresAt).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Store authentication tokens in cookies
 */
export function storeAuthTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;

  // Calculate expiration time (default 1 hour if not provided)
  const expiresAt =
    tokens.expires_at ||
    Date.now() + 60 * 60 * 1000; // 1 hour default

  // Store in cookies
  setCookie("access_token", tokens.access_token, expiresAt);
  setCookie("refresh_token", tokens.refresh_token, expiresAt);
  setCookie("token_type", tokens.token_type || "bearer", expiresAt);
  setCookie("expires_at", expiresAt.toString(), expiresAt);
}

/**
 * Get access token from cookies
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return getCookie("access_token");
}

/**
 * Get refresh token from cookies
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return getCookie("refresh_token");
}

/**
 * Get token type from cookies
 */
export function getTokenType(): string {
  if (typeof window === "undefined") return "bearer";
  return getCookie("token_type") || "bearer";
}

/**
 * Decode JWT token (basic decoding without verification)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  if (typeof window === "undefined") return true;

  const accessToken = getAccessToken();
  if (!accessToken) return true;

  // First check cookie expires_at
  const expiresAt = getCookie("expires_at");
  if (expiresAt) {
    const expirationTime = parseInt(expiresAt, 10);
    if (Date.now() >= expirationTime) {
      return true;
    }
  }

  // Also check token's exp claim if available
  const decoded = decodeToken(accessToken);
  if (decoded && decoded.exp) {
    const expirationTime = decoded.exp * 1000; // Convert to milliseconds
    if (Date.now() >= expirationTime) {
      return true;
    }
  }

  return false;
}

// -------- User helpers (decoded from token) --------

export interface AuthUser {
  fullName?: string;
  email?: string;
  userType?: string;
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = getAccessToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  const email =
    (decoded.email as string | undefined) ||
    (decoded.username as string | undefined) ||
    (decoded.sub as string | undefined);

  const firstName =
    (decoded.first_name as string | undefined) ||
    (decoded.given_name as string | undefined);
  const lastName = decoded.last_name as string | undefined;

  let fullName =
    (decoded.name as string | undefined) ||
    [firstName, lastName].filter(Boolean).join(" ");

  if (!fullName && email) {
    fullName = email.split("@")[0];
  }

  // Extract user_type from token (could be user_type, userType, or user_type_name)
  const userType =
    (decoded.user_type as string | undefined) ||
    (decoded.userType as string | undefined) ||
    (decoded.user_type_name as string | undefined);

  return {
    fullName: fullName || undefined,
    email: email || undefined,
    userType: userType || undefined,
  };
}

/**
 * Fetch user info from API and store user type
 */
export async function fetchAndStoreUserInfo(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const token = getAccessToken();
  if (!token) return null;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/v1/users/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user info");
      return null;
    }

    const userData = await response.json();
    const userType = userData.user_type?.user_type_name_key || null;

    // Store user type in localStorage for quick access
    if (userType) {
      localStorage.setItem("user_type", userType);
    }

    return userType;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return null;
  }
}

/**
 * Get user type - first try from localStorage, then from token as fallback
 */
export function getUserType(): string | null {
  if (typeof window === "undefined") return null;

  // First try to get from localStorage (from API)
  const storedUserType = localStorage.getItem("user_type");
  if (storedUserType) {
    return storedUserType;
  }

  // Fallback to token decoding if localStorage doesn't have it
  const token = getAccessToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return (
    (decoded.user_type as string | undefined) ||
    (decoded.userType as string | undefined) ||
    (decoded.user_type_name as string | undefined) ||
    null
  );
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = getAccessToken();
  return !!token && !isTokenExpired();
}

/**
 * Clear all authentication data
 */
export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;

  // Clear cookies
  deleteCookie("access_token");
  deleteCookie("refresh_token");
  deleteCookie("token_type");
  deleteCookie("expires_at");

  // Clear user data from localStorage
  localStorage.removeItem("user");
  localStorage.removeItem("user_type");
}

/**
 * Logout user and redirect to login
 */
export function logout(redirectTo: string = "/signin"): void {
  clearAuthTokens();
  if (typeof window !== "undefined") {
    window.location.href = redirectTo;
  }
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeader(): { Authorization: string } {
  const token = getAccessToken();
  const tokenType = getTokenType();

  if (!token) return { Authorization: "" };

  return {
    Authorization: `${tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} ${token}`,
  };
}

