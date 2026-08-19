import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { CreateOrderResponse, OrderListItem, OrderDetail } from "@/types/order";

export async function createOrder(payload: {
  addressId: string;
  paymentMethod: string;
  couponCode?: string;
  customerNote?: string;
}): Promise<CreateOrderResponse> {
  const res = await apiClient.post<ApiResponse<CreateOrderResponse>>("/orders", payload);
  return res.data.data;
}

export async function getMyOrders(): Promise<PagedResult<OrderListItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<OrderListItem>>>("/orders");
  return res.data.data;
}

export async function getOrderByCode(orderCode: string): Promise<OrderDetail> {
  const res = await apiClient.get<ApiResponse<OrderDetail>>(`/orders/${orderCode}`);
  return res.data.data;
}

export async function cancelOrder(orderCode: string): Promise<void> {
  await apiClient.post(`/orders/${orderCode}/cancel`);
}