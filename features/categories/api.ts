import { apiClient, ApiResponse } from "@/lib/api-client";
import { Category } from "@/types/category";

export async function getCategoryTree(): Promise<Category[]> {
  const res = await apiClient.get<ApiResponse<Category[]>>("/categories");
  return res.data.data;
}