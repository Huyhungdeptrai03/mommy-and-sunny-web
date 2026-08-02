export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalCount: number;
  ratingBreakdown: Record<number, number>;
}

export interface ProductReviewsData {
  summary: ReviewSummary;
  items: Review[];
}