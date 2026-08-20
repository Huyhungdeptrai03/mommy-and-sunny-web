import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { AdminArticle, AdminArticleListItem } from "@/types/adminArticle";

export interface ArticlePayload {
  title: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  authorName: string | null;
  category: string;
}

export async function getAdminArticles(params?: {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<AdminArticleListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminArticleListItem>>>(
    "/admin/articles",
    { params }
  );
  return res.data.data;
}

export async function getAdminArticleById(id: string): Promise<AdminArticle> {
  const res = await apiClient.get<ApiResponse<AdminArticle>>(`/admin/articles/${id}`);
  return res.data.data;
}

export async function createArticle(payload: ArticlePayload): Promise<AdminArticle> {
  const res = await apiClient.post<ApiResponse<AdminArticle>>("/admin/articles", payload);
  return res.data.data;
}

export async function updateArticle(id: string, payload: ArticlePayload): Promise<AdminArticle> {
  const res = await apiClient.put<ApiResponse<AdminArticle>>(`/admin/articles/${id}`, payload);
  return res.data.data;
}

export async function updateArticleStatus(id: string, status: string): Promise<void> {
  await apiClient.patch(`/admin/articles/${id}/status`, { status });
}

export async function deleteArticle(id: string): Promise<void> {
  await apiClient.delete(`/admin/articles/${id}`);
}
