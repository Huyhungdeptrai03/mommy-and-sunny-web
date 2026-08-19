import { OrderItem, OrderStatusHistoryItem } from "@/types/order";

export interface AdminOrderListItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

export interface AdminOrderDetail {
  orderCode: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  couponCode: string | null;
  totalAmount: number;
  depositAmount: number | null;
  depositPaymentStatus: string;
  requiresDeposit: boolean;
  customerNote: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryItem[];
}