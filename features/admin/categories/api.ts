import { apiClient, ApiResponse } from "@/lib/api-client";
import { AdminCategory } from "@/types/adminCategory";

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const res = await apiClient.get<ApiResponse<AdminCategory[]>>("/admin/categories");
  return res.data.data;
}

export async function createCategory(payload: {
  name: string;
  parentCategoryId?: string | null;
  imageUrl?: string | null;
}): Promise<AdminCategory> {
  const res = await apiClient.post<ApiResponse<AdminCategory>>("/admin/categories", payload);
  return res.data.data;
}

export async function updateCategory(
  id: string,
  payload: { name: string; parentCategoryId?: string | null; imageUrl?: string | null }
): Promise<AdminCategory> {
  const res = await apiClient.put<ApiResponse<AdminCategory>>(`/admin/categories/${id}`, payload);
  return res.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/admin/categories/${id}`);
}