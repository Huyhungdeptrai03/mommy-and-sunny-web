import { apiClient, ApiResponse } from "@/lib/api-client";
import { PublicPurchaseBatch } from "@/types/purchaseBatch";
import { PublicStats } from "@/types/publicStats";

export async function getOpenPurchaseBatches(): Promise<PublicPurchaseBatch[]> {
  const res = await apiClient.get<ApiResponse<PublicPurchaseBatch[]>>("/purchase-batches");
  return res.data.data;
}

export async function getPublicStats(): Promise<PublicStats> {
  const res = await apiClient.get<ApiResponse<PublicStats>>("/stats");
  return res.data.data;
}