export interface MonthlyStats {
  year: number;
  month: number;
  orderCount: number;
  revenue: number;
}

export interface CustomerStatsItem {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  orderCount: number;
  totalSpent: number;
}
