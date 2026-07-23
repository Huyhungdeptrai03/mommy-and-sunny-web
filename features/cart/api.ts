import { apiClient, ApiResponse } from "@/lib/api-client";
import { Cart } from "@/types/cart";

export async function getCart(): Promise<Cart> {
  const res = await apiClient.get<ApiResponse<Cart>>("/cart");
  return res.data.data;
}

export async function addCartItem(productVariantId: string, quantity: number): Promise<Cart> {
  const res = await apiClient.post<ApiResponse<Cart>>("/cart/items", {
    productVariantId,
    quantity,
  });
  return res.data.data;
}

export async function updateCartItem(itemId: string, quantity: number): Promise<Cart> {
  const res = await apiClient.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity });
  return res.data.data;
}

export async function removeCartItem(itemId: string): Promise<void> {
  await apiClient.delete(`/cart/items/${itemId}`);
}