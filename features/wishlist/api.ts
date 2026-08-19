import { apiClient, ApiResponse } from "@/lib/api-client";
import { WishlistItem } from "@/types/wishlist";

export async function getMyWishlist(): Promise<WishlistItem[]> {
  const res = await apiClient.get<ApiResponse<WishlistItem[]>>("/wishlist");
  return res.data.data;
}

export async function addToWishlist(productId: string): Promise<void> {
  await apiClient.post(`/wishlist/${productId}`);
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient.delete(`/wishlist/${productId}`);
}