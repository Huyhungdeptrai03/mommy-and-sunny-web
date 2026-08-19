import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import {
  AdminProductListItem,
  AdminProductDetail,
  ProductImageAdmin,
  ProductSpecificationAdmin,
  ProductVariantAdmin,
} from "@/types/adminProduct";

export async function getAdminProducts(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PagedResult<AdminProductListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminProductListItem>>>(
    "/admin/products",
    { params }
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
  ageRangeMinMonths?: number;
  ageRangeMaxMonths?: number;
  purchaseBatchId?: string | null;
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
    ageRangeMinMonths?: number;
    ageRangeMaxMonths?: number;
    purchaseBatchId?: string | null;
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

export async function addProductSpecification(
  productId: string,
  payload: { label: string; value: string; displayOrder: number }
): Promise<ProductSpecificationAdmin> {
  const res = await apiClient.post<ApiResponse<ProductSpecificationAdmin>>(
    `/admin/products/${productId}/specifications`,
    payload
  );
  return res.data.data;
}

export async function deleteProductSpecification(
  productId: string,
  specificationId: string
): Promise<void> {
  await apiClient.delete(`/admin/products/${productId}/specifications/${specificationId}`);
}

export async function addProductVariant(
  productId: string,
  payload: {
    sku: string;
    size?: string;
    color?: string;
    price: number;
    stockQuantity: number;
    compareAtPrice?: number | null;
    saleEndsAt?: string | null;
  }
): Promise<ProductVariantAdmin> {
  const res = await apiClient.post<ApiResponse<ProductVariantAdmin>>(
    `/admin/products/${productId}/variants`,
    payload
  );
  return res.data.data;
}

export async function updateProductVariant(
  variantId: string,
  payload: {
    sku: string;
    size?: string;
    color?: string;
    price: number;
    stockQuantity: number;
    compareAtPrice?: number | null;
    saleEndsAt?: string | null;
  }
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