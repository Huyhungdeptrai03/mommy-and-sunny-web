"use client";

import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import type { AuthResponse, AuthUser } from "@/types/auth";
import { parseOAuthCallback, type OAuthCallback } from "./safety";
import { retryAfterTime } from "./retry";

// Browser runtime only. Never read a browser's session from a Server Component.
const transport = axios.create({ baseURL: "/api", withCredentials: true, timeout: 15000 });
let accessToken: string | null = null;
let expiresAt = 0;
let epoch = 0;
let flight: { epoch: number; promise: Promise<string> } | null = null;
let bootstrap: Promise<void> | null = null;
let channel: BroadcastChannel | null = null;
let initialized = false;
let callback: OAuthCallback | null = null;
let anonymousCsrf: string | null = null;
let retryAt = 0;
let rotationUncertain = false;
let lastValidatedAt = 0;
let validationFlight: Promise<void> | null = null;
const VALIDATION_INTERVAL = 60000;

class SessionRecoveryError extends Error {
  constructor(readonly code: "AUTH_RETRY_LATER" | "AUTH_REAUTHENTICATION_REQUIRED" | "AUTH_SESSION_UNSUPPORTED") { super(code); }
}

// A missing session endpoint is latched only for this page lifetime. Reloading
// probes the contract again after a backend upgrade; no browser flag is persisted.
export const SESSION_UNSUPPORTED_MESSAGE = "Đăng nhập và các tính năng tài khoản hiện chưa khả dụng do máy chủ chưa hỗ trợ phiên đăng nhập mới. Bạn vẫn có thể xem và tìm kiếm sản phẩm. Vui lòng thử lại sau.";
export function isSessionUnsupported() { return useAuthStore.getState().sessionUnsupported; }
export function assertSessionSupported() {
  if (isSessionUnsupported()) throw new SessionRecoveryError("AUTH_SESSION_UNSUPPORTED");
}
async function sessionEndpoint<T>(path: string, request: () => Promise<T>): Promise<T> {
  assertSessionSupported();
  const expected = epoch;
  try { return await request(); }
  catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404 &&
        ["/auth/csrf", "/auth/me", "/auth/refresh-token"].includes(path)) {
      assertEpoch(expected);
      anonymousCsrf = null;
      retryAt = 0;
      clearSession();
      useAuthStore.setState({ sessionUnsupported: true });
      throw new SessionRecoveryError("AUTH_SESSION_UNSUPPORTED");
    }
    throw error;
  }
}

export function sessionGeneration() { return epoch; }
export function isCurrentSession(generation: number) { return epoch === generation; }
export function authErrorCode(error: unknown): string | undefined {
  if (error instanceof SessionRecoveryError) return error.code;
  return axios.isAxiosError(error) ? error.response?.data?.code : undefined;
}
export function authErrorMessage(error: unknown): string {
  const messages: Record<string, string> = {
    AUTH_SESSION_UNSUPPORTED: SESSION_UNSUPPORTED_MESSAGE,
    INVALID_CREDENTIALS: "Email hoặc mật khẩu không đúng.",
    SESSION_EXPIRED: "Phiên đã hết hạn. Vui lòng đăng nhập lại.",
    SESSION_REVOKED: "Phiên đã bị thu hồi. Vui lòng đăng nhập lại.",
    REFRESH_CONFLICT: "Phiên không còn hợp lệ. Vui lòng đăng nhập lại.",
    FORBIDDEN: "Yêu cầu không được phép. Vui lòng tải lại trang và thử lại.",
    EMAIL_VERIFICATION_REQUIRED: "Vui lòng xác minh email để tiếp tục.",
    RATE_LIMITED: "Bạn thao tác quá nhanh. Vui lòng thử lại sau.",
    ACCOUNT_LINK_REQUIRED: "Email đã có tài khoản. Hãy đăng nhập tài khoản đó để liên kết.",
    IDENTITY_CONFLICT: "Danh tính đã được liên kết. Không thể chuyển sang tài khoản khác.",
    REAUTHENTICATION_REQUIRED: "Vui lòng đăng nhập lại để xác nhận liên kết.",
    INVALID_HANDOFF: "Liên kết đăng nhập đã hết hạn hoặc đã dùng. Vui lòng bắt đầu lại.",
    INVALID_OAUTH_TRANSACTION: "Giao dịch đăng nhập không hợp lệ. Vui lòng bắt đầu lại.",
    PROVIDER_NOT_CONFIGURED: "Phương thức đăng nhập này hiện chưa khả dụng.",
    AUTH_RETRY_LATER: "Máy chủ tạm giới hạn hoặc chưa sẵn sàng. Vui lòng chờ thời gian thử lại.",
    AUTH_REAUTHENTICATION_REQUIRED: "Chưa xác nhận được kết quả làm mới phiên. Vui lòng đăng nhập lại; không gửi lại refresh token cũ.",
  };
  const code = authErrorCode(error);
  if (code && messages[code]) return messages[code];
  if (error instanceof Error && error.message === "WEB_LOCKS_REQUIRED") {
    return "Trình duyệt chưa hỗ trợ quản lý phiên an toàn. Vui lòng dùng trình duyệt mới qua HTTPS.";
  }
  return "Không thể hoàn tất yêu cầu. Vui lòng thử lại; không tự đặt lại đơn nếu chưa rõ kết quả.";
}

function publish(type: "changed" | "logout") { channel?.postMessage({ type }); }
export function clearSession(notice: string | null = null) {
  epoch += 1;
  accessToken = null;
  expiresAt = 0;
  rotationUncertain = false;
  lastValidatedAt = 0;
  useCartStore.getState().setItemCount(0);
  useWishlistStore.getState().setProductIds([]);
  useAuthStore.setState({ user: null, status: "anonymous", isAuthenticated: false, generation: epoch, notice, retryAt: null, recoveryRequiresLogin: false });
}
export function invalidateSession(message = "Phiên đã hết hạn. Vui lòng đăng nhập lại.") {
  clearSession(message);
  publish("logout");
}
function assertEpoch(expected: number) {
  if (epoch !== expected) throw new axios.CanceledError("Authentication session changed");
}
async function exclusive<T>(run: () => Promise<T>): Promise<T> {
  if (typeof navigator === "undefined" || !navigator.locks) throw new Error("WEB_LOCKS_REQUIRED");
  return navigator.locks.request("mommy-and-sunny-auth-session", {
    mode: "exclusive", signal: AbortSignal.timeout(60000),
  }, run);
}
async function csrf(bearer?: string): Promise<string> {
  // The refresh cookie never authenticates this request: anonymous principal is
  // stable across rotations. Never reuse this request token for a Bearer link.
  if (!bearer && anonymousCsrf) return anonymousCsrf;
  assertSessionSupported();
  const response = await sessionEndpoint("/auth/csrf", () => transport.get("/auth/csrf", {
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  }));
  const value = response.data?.data?.csrfToken;
  if (typeof value !== "string" || !value) throw new Error("Invalid CSRF response");
  if (!bearer) anonymousCsrf = value;
  return value;
}
async function cookiePost<T>(path: string, body?: unknown, bearer?: string, sending?: () => void): Promise<T> {
  const token = await csrf(bearer);
  try {
    sending?.();
    const response = await sessionEndpoint(path, () => transport.post(path, body, { headers: {
      "X-CSRF-TOKEN": token,
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    } }));
    return response.data.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 403) anonymousCsrf = null;
    throw error;
  }
}
function accept(result: AuthResponse, expected: number) {
  assertEpoch(expected);
  const expiry = Date.parse(result?.accessTokenExpiresAt);
  if (!result?.accessToken || !result.user?.id || !Number.isFinite(expiry) || expiry <= Date.now()) {
    throw new Error("Invalid auth response");
  }
  if (useAuthStore.getState().user && useAuthStore.getState().user?.id !== result.user.id) clearSession();
  accessToken = result.accessToken;
  expiresAt = expiry;
  lastValidatedAt = Date.now();
  rotationUncertain = false;
  useAuthStore.setState({ user: result.user, status: "authenticated", isAuthenticated: true, notice: null, retryAt: null, recoveryRequiresLogin: false });
  return accessToken;
}
async function loadMember(token: string, expected: number) {
  const response = await sessionEndpoint("/auth/me", () => transport.get("/auth/me", { headers: { Authorization: `Bearer ${token}` } }));
  assertEpoch(expected);
  const user = response.data.data as AuthUser;
  if (!user?.id || user.id !== useAuthStore.getState().user?.id) throw new Error("Invalid member response");
  lastValidatedAt = Date.now();
  useAuthStore.setState({ user, notice: null, retryAt: null });
}

function definitiveFailure(error: unknown) {
  const code = authErrorCode(error);
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  return (status === 401 && ["SESSION_REVOKED", "SESSION_EXPIRED"].includes(code ?? "")) ||
    (status === 409 && code === "REFRESH_CONFLICT");
}
function pauseRecovery(error: unknown, postStarted = false) {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  // A failed GET is safe to try later; a lost/5xx rotation response may have
  // committed. Never automatically replay that refresh, even after a delay.
  rotationUncertain ||= postStarted && (status === undefined || status >= 500);
  retryAt = status === 429
    ? retryAfterTime(axios.isAxiosError(error) ? error.response?.headers?.["retry-after"] : undefined)
    : Date.now() + 60000;
  useAuthStore.setState({
    notice: rotationUncertain
      ? authErrorMessage(new SessionRecoveryError("AUTH_REAUTHENTICATION_REQUIRED"))
      : "Không thể kiểm tra phiên lúc này. Phiên chưa bị xác nhận thu hồi; vui lòng thử lại sau.",
    retryAt,
    recoveryRequiresLogin: rotationUncertain,
  });
  channel?.postMessage({ type: "backoff", retryAt, uncertain: rotationUncertain });
}

export function refreshSession(): Promise<string> {
  if (isSessionUnsupported()) return Promise.reject(new SessionRecoveryError("AUTH_SESSION_UNSUPPORTED"));
  const expected = epoch;
  if (flight?.epoch === expected) return flight.promise;
  let postStarted = false;
  const promise = exclusive(async () => {
    assertEpoch(expected);
    if (rotationUncertain) throw new SessionRecoveryError("AUTH_REAUTHENTICATION_REQUIRED");
    if (Date.now() < retryAt) throw new SessionRecoveryError("AUTH_RETRY_LATER");
    const result = await cookiePost<AuthResponse>("/auth/refresh-token", undefined, undefined, () => { postStarted = true; });
    const token = accept(result, expected);
    // AuthResult already includes the current member from the authoritative DB.
    // A second /auth/me here duplicates the session read and consumes rate quota.
    return token;
  }).catch((error) => {
    if (epoch === expected) {
      if (definitiveFailure(error)) invalidateSession(authErrorMessage(error));
      else if (!(error instanceof SessionRecoveryError)) pauseRecovery(error, postStarted);
    }
    throw error;
  }).finally(() => {
    if (flight?.promise === promise) flight = null;
  });
  flight = { epoch: expected, promise };
  return promise;
}
export async function ensureAccessToken(force = false): Promise<string | null> {
  if (isSessionUnsupported()) return null;
  if (!force && accessToken && expiresAt > Date.now() + 30000) return accessToken;
  if (useAuthStore.getState().status === "anonymous" && !force) return null;
  try { return await refreshSession(); }
  catch (error) {
    if (isSessionUnsupported()) return null;
    // A still-valid JWT can be used through temporary recovery failures. An
    // expired token is never sent to a mutation as a fallback.
    if (!force && accessToken && expiresAt > Date.now() && !definitiveFailure(error)) return accessToken;
    throw error;
  }
}
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  const expected = epoch;
  return exclusive(async () => {
    assertEpoch(expected);
    const result = await cookiePost<AuthResponse>("/auth/login", { email, password });
    assertEpoch(expected);
    clearSession();
    accept(result, epoch);
    retryAt = 0;
    publish("changed");
    return result;
  });
}
export async function signOut(): Promise<void> {
  clearSession();
  const expected = epoch;
  publish("logout");
  try {
    await exclusive(() => cookiePost<null>("/auth/logout"));
  } catch (error) {
    if (epoch === expected) useAuthStore.setState({ notice: "Đã xóa dữ liệu trên trang, nhưng chưa xác nhận thu hồi phiên trên máy chủ. Vui lòng thử đăng xuất lại." });
    throw error;
  }
}
export async function exchangeExternal(code: string, emailVerificationToken?: string, linkExistingAccount = false) {
  const expected = epoch;
  return exclusive(async () => {
    assertEpoch(expected);
    const bearer = linkExistingAccount ? accessToken : undefined;
    if (linkExistingAccount && !bearer) throw new Error("Missing authenticated account");
    const result = await cookiePost<AuthResponse>("/auth/external/exchange", {
      code, emailVerificationToken, linkExistingAccount,
    }, bearer ?? undefined);
    assertEpoch(expected);
    clearSession();
    accept(result, epoch);
    publish("changed");
    return result;
  });
}
export async function submitExternalEmail(code: string, email: string, fullName: string) {
  const expected = epoch;
  await exclusive(async () => {
    assertEpoch(expected);
    await cookiePost<null>("/auth/external/email", { code, email, fullName });
    assertEpoch(expected);
  });
}
export function captureOAuthCallback(): OAuthCallback {
  if (!callback && typeof window !== "undefined" && window.location.pathname === "/auth/callback") {
    callback = parseOAuthCallback(window.location.search);
    window.history.replaceState(null, "", "/auth/callback");
  }
  return callback ?? { error: "INVALID_HANDOFF" };
}
export function initializeSession(): Promise<void> {
  if (bootstrap) return bootstrap;
  if (!initialized) {
    initialized = true;
    try { window.localStorage.removeItem("mommy-and-sunny-auth"); } catch { /* storage may be disabled */ }
    captureOAuthCallback();
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("mommy-and-sunny-auth-events");
      channel.onmessage = (event) => {
        if (isSessionUnsupported()) return;
        if (event.data?.type === "logout") clearSession();
        if (event.data?.type === "backoff" && Number.isFinite(event.data.retryAt)) {
          retryAt = Math.max(retryAt, event.data.retryAt);
          rotationUncertain ||= event.data.uncertain === true;
          useAuthStore.setState({ retryAt, recoveryRequiresLogin: rotationUncertain,
            notice: rotationUncertain ? authErrorMessage(new SessionRecoveryError("AUTH_REAUTHENTICATION_REQUIRED"))
              : "Máy chủ tạm giới hạn kiểm tra phiên. Vui lòng chờ thời gian thử lại.",
          });
        }
        if (event.data?.type === "changed") {
          clearSession();
          useAuthStore.setState({ status: "checking" });
          void refreshSession().catch(() => undefined);
        }
      };
    }
  }
  if (window.location.pathname === "/auth/callback") {
    clearSession();
    bootstrap = Promise.resolve();
  } else bootstrap = refreshSession().then(() => undefined).catch((error) => {
    // No cookie on a first anonymous visit is normal, not an alarming banner.
    if (authErrorCode(error) === "SESSION_EXPIRED") useAuthStore.setState({ notice: null });
  });
  return bootstrap;
}
export function revalidateSession(): Promise<void> {
  if (validationFlight) return validationFlight;
  if (useAuthStore.getState().status === "anonymous" || rotationUncertain || Date.now() < retryAt ||
      (accessToken && Date.now() - lastValidatedAt < VALIDATION_INTERVAL)) return Promise.resolve();
  const expected = epoch;
  const promise = (async () => {
    try {
      const previousToken = accessToken;
      const token = await ensureAccessToken();
      // A rotation already performed this DB validation and returned a profile.
      if (token && token === previousToken && Date.now() >= retryAt && !rotationUncertain) await loadMember(token, expected);
    } catch (error) {
      if (epoch === expected) {
        if (definitiveFailure(error)) invalidateSession(authErrorMessage(error));
        else if (!(error instanceof SessionRecoveryError)) pauseRecovery(error);
      }
    }
  })().finally(() => { if (validationFlight === promise) validationFlight = null; });
  validationFlight = promise;
  return promise;
}
