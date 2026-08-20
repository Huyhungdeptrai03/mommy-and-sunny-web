export type ArticleCategory = "News" | "Library";
export type ArticleStatus = "Draft" | "Published";

export interface ArticleListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  category: ArticleCategory;
  publishedAt: string | null;
}

export interface Article extends ArticleListItem {
  content: string;
}
