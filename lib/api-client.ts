import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { notifyAdminMutationSuccess } from "@/lib/admin-notification";
import { ensureAccessToken, invalidateSession, isCurrentSession, sessionGeneration, authErrorCode } from "@/features/auth/session";

export const apiClient = axios.create({
  // Public server-rendered catalog requests need an absolute backend URL.
  // Browser traffic always stays on the reverse-proxied origin.
  baseURL: typeof window === "undefined"
    ? process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL
    : "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
interface SessionRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _authGeneration?: number;
}
function assertCurrent(config: SessionRequest) {
  if (config._authGeneration !== undefined && !isCurrentSession(config._authGeneration)) {
    throw new axios.CanceledError("Authentication session changed");
  }
}
function isAuthRequest(config: SessionRequest) {
  return /^\/?auth(?:\/|$)/i.test(config.url ?? "");
}
apiClient.interceptors.request.use(async (config: SessionRequest) => {
  assertCurrent(config);
  if (typeof window !== "undefined" &&
      (config.baseURL !== "/api" || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(config.url ?? ""))) {
    throw new axios.CanceledError("Cross-origin API request blocked");
  }
  // Auth cookie/CSRF calls are handled by the dedicated session transport.
  if (typeof window !== "undefined" && !isAuthRequest(config)) {
    const generation = sessionGeneration();
    const token = await ensureAccessToken();
    if (!isCurrentSession(generation)) throw new axios.CanceledError("Authentication session changed");
    if (token) {
      config._authGeneration = generation;
      config.headers.Authorization = `Bearer ${token}`;
    } else config.headers.delete("Authorization");
  } else config.headers.delete("Authorization");
  return config;
});
apiClient.interceptors.response.use((response) => {
  assertCurrent(response.config as SessionRequest);
  notifyAdminMutationSuccess(response.config.url, response.config.method);
  return response;
}, async (error: AxiosError) => {
  const config = error.config as SessionRequest | undefined;
  if (config) assertCurrent(config);
  if (!config || isAuthRequest(config) || config._authGeneration === undefined) throw error;
  const code = authErrorCode(error);
  if (code === "SESSION_REVOKED") {
    invalidateSession();
    throw error;
  }
  if (error.response?.status !== 401) throw error; // Never refresh on 403/network/5xx.
  if (config._retry) { invalidateSession(); throw error; }
  // Business mutations are never replayed automatically, even after a 401.
  if (!["get", "head", "options"].includes((config.method ?? "get").toLowerCase()) ||
      (code !== undefined && code !== "SESSION_EXPIRED")) throw error;
  config._retry = true;
  const currentToken = await ensureAccessToken();
  assertCurrent(config);
  if (config.headers.Authorization === `Bearer ${currentToken}`) await ensureAccessToken(true);
  assertCurrent(config);
  return apiClient(config);
});
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
  code?: string;
  errors?: Record<string, string[]>;
}
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
