import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import {
  AdminProductListItem,
  AdminProductDetail,
  ProductImageAdmin,
  ProductVariantAdmin,
} from "@/types/adminProduct";

export async function getAdminProducts(): Promise<PagedResult<AdminProductListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminProductListItem>>>(
    "/admin/products"
  );
  return res.data.data;
}

export async function getAdminProductById(id: string): Promise<AdminProductDetail> {
  const res = await apiClient.get<ApiResponse<AdminProductDetail>>(`/admin/products/${id}`);
  return res.data.data;
}

export async function createProduct(payload: {
  categoryId: string;
  name: string;
  description?: string;
  brand?: string;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
}): Promise<AdminProductDetail> {
  const res = await apiClient.post<ApiResponse<AdminProductDetail>>("/admin/products", payload);
  return res.data.data;
}

export async function updateProduct(
  id: string,
  payload: {
    categoryId: string;
    name: string;
    description?: string;
    brand?: string;
    ageRangeMinMonths: number;
    ageRangeMaxMonths: number;
  }
): Promise<AdminProductDetail> {
  const res = await apiClient.put<ApiResponse<AdminProductDetail>>(
    `/admin/products/${id}`,
    payload
  );
  return res.data.data;
}

export async function updateProductStatus(id: string, status: string): Promise<void> {
  await apiClient.patch(`/admin/products/${id}/status`, { status });
}

export async function addProductImage(
  productId: string,
  payload: { imageUrl: string; isPrimary: boolean; displayOrder: number }
): Promise<ProductImageAdmin> {
  const res = await apiClient.post<ApiResponse<ProductImageAdmin>>(
    `/admin/products/${productId}/images`,
    payload
  );
  return res.data.data;
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/admin/products/${productId}/images/${imageId}`);
}

export async function addProductVariant(
  productId: string,
  payload: { sku: string; size?: string; color?: string; price: number; stockQuantity: number }
): Promise<ProductVariantAdmin> {
  const res = await apiClient.post<ApiResponse<ProductVariantAdmin>>(
    `/admin/products/${productId}/variants`,
    payload
  );
  return res.data.data;
}

export async function updateProductVariant(
  variantId: string,
  payload: { sku: string; size?: string; color?: string; price: number; stockQuantity: number }
): Promise<ProductVariantAdmin> {
  const res = await apiClient.put<ApiResponse<ProductVariantAdmin>>(
    `/admin/variants/${variantId}`,
    payload
  );
  return res.data.data;
}

export async function deleteProductVariant(variantId: string): Promise<void> {
  await apiClient.delete(`/admin/variants/${variantId}`);
}