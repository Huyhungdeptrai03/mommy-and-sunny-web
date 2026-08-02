import { apiClient, ApiResponse } from "@/lib/api-client";
import { AuthResponse, RegisterResponse } from "@/types/auth";

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", {
    email,
    password,
  });
  return res.data.data;
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

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post("/auth/verify-email", { token });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", { token, newPassword });
}