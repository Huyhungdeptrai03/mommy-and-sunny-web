export interface AdminReview {
  id: string;
  productId: string;
  productName: string;
  userFullName: string;
  userEmail: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}