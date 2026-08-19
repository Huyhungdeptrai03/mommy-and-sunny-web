import { apiClient, ApiResponse } from "@/lib/api-client";
import { AdminCoupon } from "@/types/adminCoupon";

export async function getAdminCoupons(): Promise<AdminCoupon[]> {
  const res = await apiClient.get<ApiResponse<AdminCoupon[]>>("/admin/coupons");
  return res.data.data;
}

export interface CouponPayload {
  code?: string; // chỉ dùng lúc tạo, không gửi lúc sửa
  discountType: string;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderValue?: number | null;
  categoryId?: string | null;
  startDate: string;
  endDate: string;
  totalUsageLimit?: number | null;
  isActive?: boolean;
}

export async function createCoupon(payload: CouponPayload): Promise<AdminCoupon> {
  const res = await apiClient.post<ApiResponse<AdminCoupon>>("/admin/coupons", payload);
  return res.data.data;
}

export async function updateCoupon(id: string, payload: CouponPayload): Promise<AdminCoupon> {
  const res = await apiClient.put<ApiResponse<AdminCoupon>>(`/admin/coupons/${id}`, payload);
  return res.data.data;
}

export async function deleteCoupon(id: string): Promise<void> {
  await apiClient.delete(`/admin/coupons/${id}`);
}