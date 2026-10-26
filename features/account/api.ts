import { apiClient, ApiResponse } from "@/lib/api-client";
import { Address } from "@/types/address";
import type { AuthUser } from "@/types/auth";

export async function getProfile(): Promise<AuthUser> {
  const res = await apiClient.get<ApiResponse<AuthUser>>("/account/me");
  return res.data.data;
}
export async function updateProfile(payload: { fullName: string; phoneNumber: string | null }): Promise<AuthUser> {
  const res = await apiClient.patch<ApiResponse<AuthUser>>("/account/me", {
    fullName: payload.fullName, phoneNumber: payload.phoneNumber,
  });
  return res.data.data;
}

export async function getMyAddresses(): Promise<Address[]> {
  const res = await apiClient.get<ApiResponse<Address[]>>("/account/addresses");
  return res.data.data;
}

export async function createAddress(payload: {
  recipientName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  detailAddress: string;
  isDefault: boolean;
}): Promise<Address> {
  const res = await apiClient.post<ApiResponse<Address>>("/account/addresses", payload);
  return res.data.data;
}
