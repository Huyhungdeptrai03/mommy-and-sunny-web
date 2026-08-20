import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { Article, ArticleListItem, ArticleCategory } from "@/types/article";

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
