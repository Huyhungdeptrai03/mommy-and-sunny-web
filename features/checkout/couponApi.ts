import { apiClient, ApiResponse } from "@/lib/api-client";

export interface ApplyCouponResult {
  isValid: boolean;
  message: string | null;
  discountAmount: number;
}

export async function applyCoupon(code: string): Promise<ApplyCouponResult> {
  const res = await apiClient.post<ApiResponse<ApplyCouponResult>>("/coupons/apply", { code });
  return res.data.data;
}