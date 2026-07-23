import { apiClient, ApiResponse } from "@/lib/api-client";
import { DashboardSummary, RevenueChartPoint } from "@/types/adminDashboard";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await apiClient.get<ApiResponse<DashboardSummary>>("/admin/dashboard/summary");
  return res.data.data;
}

export async function getRevenueChart(days = 7): Promise<RevenueChartPoint[]> {
  const res = await apiClient.get<ApiResponse<RevenueChartPoint[]>>(
    "/admin/dashboard/revenue-chart",
    { params: { days } }
  );
  return res.data.data;
}