import { apiClient, ApiResponse } from "@/lib/api-client";
import { Policy } from "@/types/policy";

export async function getPolicyBySlug(slug: string): Promise<Policy> {
  const res = await apiClient.get<ApiResponse<Policy>>(`/policies/${slug}`);
  return res.data.data;
}
