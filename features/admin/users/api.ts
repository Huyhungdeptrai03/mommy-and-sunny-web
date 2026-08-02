import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { AdminUser } from "@/types/adminUser";

export async function getAdminUsers(search?: string): Promise<PagedResult<AdminUser>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminUser>>>("/admin/users", {
    params: { search, pageSize: 50 },
  });
  return res.data.data;
}

export async function updateUserRole(id: string, role: string): Promise<AdminUser> {
  const res = await apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${id}/role`, { role });
  return res.data.data;
}