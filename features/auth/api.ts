import { apiClient, ApiResponse } from "@/lib/api-client";
import { AuthResponse, RegisterResponse } from "@/types/auth";
import { signIn, invalidateSession } from "./session";

export async function login(email: string, password: string): Promise<AuthResponse> {
  return signIn(email, password);
}

export async function register(payload: {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}): Promise<RegisterResponse> {
  const res = await apiClient.post<ApiResponse<RegisterResponse>>("/auth/register", payload);
  return res.data.data;
}

let verification: { token: string; promise: Promise<void> } | null = null;
export function verifyEmail(token: string): Promise<void> {
  if (verification?.token === token) return verification.promise;
  const promise = apiClient.post("/auth/verify-email", { token }).then(() => undefined);
  verification = { token, promise };
  return promise;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, newPassword });
  invalidateSession("Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.");
}

export async function resendVerification(email: string): Promise<void> {
  await apiClient.post("/auth/resend-verification", { email });
}
