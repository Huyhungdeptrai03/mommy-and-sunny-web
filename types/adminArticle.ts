export interface AdminArticleListItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  authorName: string | null;
  category: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
