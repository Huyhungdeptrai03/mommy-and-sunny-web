import { apiClient, ApiResponse, PagedResult } from "@/lib/api-client";
import { CustomerStatsItem, MonthlyStats } from "@/types/adminStats";

export async function getMonthlyStats(months = 12): Promise<MonthlyStats[]> {
  const res = await apiClient.get<ApiResponse<MonthlyStats[]>>("/admin/stats/monthly", {
    params: { months },
  });
  return res.data.data;
}

export async function getCustomerStats(params: {
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<CustomerStatsItem>> {
  const res = await apiClient.get<ApiResponse<PagedResult<CustomerStatsItem>>>(
    "/admin/stats/customers",
    { params }
  );
  return res.data.data;
}
