export function formatCurrency(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ xác nhận",
  Confirmed: "Đã xác nhận",
  Shipping: "Đang giao",
  Delivered: "Đã giao",
  Cancelled: "Đã hủy",
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-gray-100 text-gray-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Shipping: "bg-yellow-100 text-yellow-700",
  Delivered: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

export function getOrderStatusColor(status: string): string {
  return ORDER_STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700";
}