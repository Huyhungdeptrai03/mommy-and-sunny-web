import { apiClient, ApiResponse } from "@/lib/api-client";
import { AdminPurchaseBatch } from "@/types/adminPurchaseBatch";

export async function getAdminPurchaseBatches(): Promise<AdminPurchaseBatch[]> {
  const res = await apiClient.get<ApiResponse<AdminPurchaseBatch[]>>("/admin/purchase-batches");
  return res.data.data;
}

export async function createPurchaseBatch(payload: {
  name: string;
  countryOfOrigin?: string | null;
  openDate: string;
  closeDate: string;
  estimatedArrivalDate?: string | null;
}): Promise<AdminPurchaseBatch> {
  const res = await apiClient.post<ApiResponse<AdminPurchaseBatch>>(
    "/admin/purchase-batches",
    payload
  );
  return res.data.data;
}

export async function updatePurchaseBatch(
  id: string,
  payload: {
    name: string;
    countryOfOrigin?: string | null;
    openDate: string;
    closeDate: string;
    estimatedArrivalDate?: string | null;
  }
): Promise<AdminPurchaseBatch> {
  const res = await apiClient.put<ApiResponse<AdminPurchaseBatch>>(
    `/admin/purchase-batches/${id}`,
    payload
  );
  return res.data.data;
}

export async function updatePurchaseBatchStatus(
  id: string,
  status: string
): Promise<AdminPurchaseBatch> {
  const res = await apiClient.put<ApiResponse<AdminPurchaseBatch>>(
    `/admin/purchase-batches/${id}/status`,
    { status }
  );
  return res.data.data;
}

export async function deletePurchaseBatch(id: string): Promise<void> {
  await apiClient.delete(`/admin/purchase-batches/${id}`);
}