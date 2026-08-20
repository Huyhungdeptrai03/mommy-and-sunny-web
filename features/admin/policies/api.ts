import { apiClient, ApiResponse } from "@/lib/api-client";
import { AdminPolicy } from "@/types/adminPolicy";

export async function getAdminPolicies(): Promise<AdminPolicy[]> {
  const res = await apiClient.get<ApiResponse<AdminPolicy[]>>("/admin/policies");
  return res.data.data;
}

export async function updateAdminPolicy(
  id: string,
  payload: { title: string; content: string }
): Promise<AdminPolicy> {
  const res = await apiClient.put<ApiResponse<AdminPolicy>>(`/admin/policies/${id}`, payload);
  return res.data.data;
}
