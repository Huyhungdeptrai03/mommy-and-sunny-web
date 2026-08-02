export interface CreateOrderResponse {
  orderCode: string;
  totalAmount: number;
  status: string;
  paymentUrl: string | null;
}

export interface OrderListItem {
  orderCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

export interface OrderItem {
  productName: string;
  variantDescription: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderStatusHistoryItem {
  fromStatus: string | null;
  toStatus: string;
  note: string | null;
  changedAt: string;
}

export interface OrderDetail {
  orderCode: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  subTotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  customerNote: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: OrderStatusHistoryItem[];
}