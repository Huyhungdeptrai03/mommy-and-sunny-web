import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { AdminReview } from "@/types/adminReview";

export async function getAdminReviews(rating?: number): Promise<PagedResult<AdminReview>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminReview>>>("/admin/reviews", {
    params: { rating, pageSize: 50 },
  });
  return res.data.data;
}

export async function deleteReview(id: string): Promise<void> {
  await apiClient.delete(`/admin/reviews/${id}`);
}