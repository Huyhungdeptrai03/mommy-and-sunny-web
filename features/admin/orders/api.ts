import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { AdminOrderListItem, AdminOrderDetail } from "@/types/adminOrder";

export async function getAdminOrders(status?: string): Promise<PagedResult<AdminOrderListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<AdminOrderListItem>>>("/admin/orders", {
    params: status ? { status } : undefined,
  });
  return res.data.data;
}

export async function getAdminOrderById(id: string): Promise<AdminOrderDetail> {
  const res = await apiClient.get<ApiResponse<AdminOrderDetail>>(`/admin/orders/${id}`);
  return res.data.data;
}

export async function updateOrderStatus(
  id: string,
  toStatus: string,
  note?: string
): Promise<void> {
  await apiClient.patch(`/admin/orders/${id}/status`, { toStatus, note });
}