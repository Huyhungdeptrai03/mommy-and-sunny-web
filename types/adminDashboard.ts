export interface DashboardSummary {
  totalRevenue: number;
  ordersToday: number;
  ordersThisWeek: number;
  pendingOrdersCount: number;
}

export interface RevenueChartPoint {
  date: string;
  revenue: number;
}