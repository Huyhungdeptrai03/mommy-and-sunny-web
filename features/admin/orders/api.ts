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

export async function setOrderDeposit(id: string, depositAmount: number): Promise<AdminOrderDetail> {
  const res = await apiClient.put<ApiResponse<AdminOrderDetail>>(`/admin/orders/${id}/deposit`, {
    depositAmount,
  });
  return res.data.data;
}

export async function markDepositPaid(id: string): Promise<AdminOrderDetail> {
  const res = await apiClient.post<ApiResponse<AdminOrderDetail>>(
    `/admin/orders/${id}/deposit/mark-paid`
  );
  return res.data.data;
}

export async function markFinalPaymentPaid(id: string): Promise<AdminOrderDetail> {
  const res = await apiClient.post<ApiResponse<AdminOrderDetail>>(`/admin/orders/${id}/mark-paid`);
  return res.data.data;
}