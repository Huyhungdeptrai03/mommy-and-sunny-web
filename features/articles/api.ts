import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { Article, ArticleComment, ArticleListItem, ArticleCategory } from "@/types/article";

export interface ArticleFilter {
  category?: ArticleCategory;
  page?: number;
  pageSize?: number;
}

export async function getArticles(filter?: ArticleFilter): Promise<PagedResult<ArticleListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<ArticleListItem>>>("/articles", {
    params: filter,
  });
  return res.data.data;
}

export async function getArticleBySlug(slug: string): Promise<Article> {
  const res = await apiClient.get<ApiResponse<Article>>(`/articles/${slug}`);
  return res.data.data;
}

export async function getArticleComments(articleId: string): Promise<ArticleComment[]> {
  const res = await apiClient.get<ApiResponse<ArticleComment[]>>(`/articles/${articleId}/comments`);
  return res.data.data;
}

export async function createArticleComment(articleId: string, content: string): Promise<ArticleComment> {
  const res = await apiClient.post<ApiResponse<ArticleComment>>(`/articles/${articleId}/comments`, {
    content,
  });
  return res.data.data;
}
