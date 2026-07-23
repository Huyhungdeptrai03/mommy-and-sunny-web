import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { ProductListItem, Product } from "@/types/product";

export async function getProducts(): Promise<PagedResult<ProductListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<ProductListItem>>>("/products");
  return res.data.data;
}

export async function getProductBySlug(slug: string): Promise<Product> {
  // Chặn sớm nếu slug không hợp lệ (VD: "undefined" do lỗi truy cập property phía FE) —
  // tránh gọi API vô ích, và giúp lỗi hiện ra rõ ràng ngay tại đây thay vì lan xuống tận BE
  if (!slug || slug === "undefined") {
    throw new Error(`Slug không hợp lệ: "${slug}"`);
  }

  const res = await apiClient.get<ApiResponse<Product>>(`/products/${slug}`);
  return res.data.data;
}