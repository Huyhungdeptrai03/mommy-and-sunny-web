import { apiClient, ApiResponse } from "@/lib/api-client";
import { Address } from "@/types/address";

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