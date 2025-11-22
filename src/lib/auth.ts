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
  [key: string]: any;
}

/**
 * Store authentication tokens in localStorage and sync to cookies
 */
export function storeAuthTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;

  // Calculate expiration time (default 1 hour if not provided)
  const expiresAt =
    tokens.expires_at ||
    Date.now() + 60 * 60 * 1000; // 1 hour default

  // Store in localStorage
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  localStorage.setItem("token_type", tokens.token_type || "bearer");
  localStorage.setItem("expires_at", expiresAt.toString());

  // Also store in cookies for server-side middleware access
  const cookieExpires = new Date(expiresAt).toUTCString();
  document.cookie = `access_token=${tokens.access_token}; expires=${cookieExpires}; path=/; SameSite=Lax`;
  document.cookie = `token_type=${tokens.token_type || "bearer"}; expires=${cookieExpires}; path=/; SameSite=Lax`;
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refresh_token");
}

/**
 * Get token type from localStorage
 */
export function getTokenType(): string {
  if (typeof window === "undefined") return "bearer";
  return localStorage.getItem("token_type") || "bearer";
}

/**
 * Decode JWT token (basic decoding without verification)
 */
function decodeToken(token: string): DecodedToken | null {
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

  // First check localStorage expires_at
  const expiresAt = localStorage.getItem("expires_at");
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
  
  // Clear localStorage
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("expires_at");
  localStorage.removeItem("user");
  
  // Clear cookies
  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  document.cookie = "token_type=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
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
export function getAuthHeader(): { Authorization: string } | {} {
  const token = getAccessToken();
  const tokenType = getTokenType();
  
  if (!token) return {};
  
  return {
    Authorization: `${tokenType.charAt(0).toUpperCase() + tokenType.slice(1)} ${token}`,
  };
}

