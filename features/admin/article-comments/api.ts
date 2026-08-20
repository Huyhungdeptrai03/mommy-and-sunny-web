import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { AdminArticleComment } from "@/types/adminArticleComment";

export async function getAdminArticleComments(): Promise<PagedResult<AdminArticleComment>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminArticleComment>>>(
    "/admin/articles/comments"
  );
  return res.data.data;
}

export async function deleteAdminArticleComment(id: string): Promise<void> {
  await apiClient.delete(`/admin/articles/comments/${id}`);
}
