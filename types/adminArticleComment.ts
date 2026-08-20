export interface AdminArticleComment {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  userFullName: string;
  userEmail: string;
  content: string;
  createdAt: string;
}
