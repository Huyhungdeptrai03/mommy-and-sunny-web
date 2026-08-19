export function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Purchasing: "Đang mua hàng",
  InternationalShipping: "Đang vận chuyển quốc tế",
  ArrivedAtWarehouse: "Đã về kho",
  Shipping: "Đang giao",
  Delivered: "Đã giao",
  Cancelled: "Đã hủy",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-[var(--brand-yellow)] text-[var(--brand-olive-dark)]",
  Confirmed: "bg-[var(--brand-blue)] text-[var(--brand-olive-dark)]",
  Purchasing: "bg-[var(--brand-blue)] text-[var(--brand-olive-dark)]",
  InternationalShipping: "bg-[var(--brand-blue)] text-[var(--brand-olive-dark)]",
  ArrivedAtWarehouse: "bg-[var(--brand-yellow)] text-[var(--brand-olive-dark)]",
  Shipping: "bg-[var(--brand-pink)] text-[var(--brand-olive-dark)]",
  Delivered: "bg-[var(--brand-green)] text-[var(--brand-olive-dark)]",
  Cancelled: "bg-red-100 text-red-700",
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
}