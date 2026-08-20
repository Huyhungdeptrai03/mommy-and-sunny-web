import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { ProductListItem, Product } from "@/types/product";
import { FlashSaleItem } from "@/types/flashSale";

export interface ProductFilter {
  search?: string;
  categorySlug?: string;
  ageMonths?: number;
  purchaseBatchId?: string;
  page?: number;
  pageSize?: number;
}

export async function getProducts(filter?: ProductFilter): Promise<PagedResult<ProductListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<ProductListItem>>>("/products", {
    params: filter,
  });
  return res.data.data;
}

export async function getProductBySlug(slug: string): Promise<Product> {
  if (!slug || slug === "undefined") {
    throw new Error(`Slug không hợp lệ: "${slug}"`);
  }

  const res = await apiClient.get<ApiResponse<Product>>(`/products/${slug}`);
  return res.data.data;
}

export async function getFlashSaleProducts(): Promise<FlashSaleItem[]> {
  const res = await apiClient.get<ApiResponse<FlashSaleItem[]>>("/products/flash-sale");
  return res.data.data;
}

export async function getBrands(): Promise<string[]> {
  const res = await apiClient.get<ApiResponse<string[]>>("/products/brands");
  return res.data.data;
}