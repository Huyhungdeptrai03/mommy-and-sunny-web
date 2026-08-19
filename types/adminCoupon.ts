export interface AdminCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderValue: number | null;
  categoryId: string | null;
  categoryName: string | null;
  startDate: string;
  endDate: string;
  totalUsageLimit: number | null;
  usageCount: number;
  isActive: boolean;
}