import { apiClient, ApiResponse } from "@/lib/api-client";
import { Review, ProductReviewsData } from "@/types/review";

export async function getProductReviews(productId: string): Promise<ProductReviewsData> {
  const res = await apiClient.get<ApiResponse<ProductReviewsData>>(
    `/products/${productId}/reviews`
  );
  return res.data.data;
}

export async function canReviewProduct(productId: string): Promise<boolean> {
  const res = await apiClient.get<ApiResponse<{ canReview: boolean }>>(
    `/products/${productId}/reviews/can-review`
  );
  return res.data.data.canReview;
}

export async function createReview(
  productId: string,
  rating: number,
  comment?: string
): Promise<Review> {
  const res = await apiClient.post<ApiResponse<Review>>(`/products/${productId}/reviews`, {
    rating,
    comment,
  });
  return res.data.data;
}