"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminOrders } from "@/features/admin/orders/api";
import { formatCurrency, getOrderStatusLabel, getOrderStatusColor } from "@/lib/utils";
import { AdminOrderListItem } from "@/types/adminOrder";

export default function AdminOrderList() {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [statusFilter]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminOrders(statusFilter || undefined);
      setOrders(result.items);
    } catch {
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }

  const selectClass =
    "border border-[var(--brand-border)] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
          Quản lý đơn hàng
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Pending">Chờ xác nhận</option>
          <option value="Confirmed">Đã xác nhận</option>
          <option value="Shipping">Đang giao</option>
          <option value="Delivered">Đã giao</option>
          <option value="Cancelled">Đã hủy</option>
        </select>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--brand-text-muted)]">Đang tải...</p>
      ) : (
        <div className="rounded-2xl border border-[var(--brand-border)] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-cream-dark)] text-left">
              <tr>
                <th className="p-3 font-heading text-[var(--brand-text)]">Mã đơn</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Khách hàng</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Trạng thái</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Thanh toán</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Tổng tiền</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Ngày đặt</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-[var(--brand-text-muted)]">
                    Không có đơn hàng nào
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-t border-[var(--brand-border)]">
                    <td className="p-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-medium text-[var(--brand-text)] hover:text-[var(--brand-olive)]"
                      >
                        {o.orderCode}
                      </Link>
                    </td>
                    <td className="p-3">
                      <p className="text-[var(--brand-text)]">{o.customerName}</p>
                      <p className="text-xs text-[var(--brand-text-muted)]">{o.customerEmail}</p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${getOrderStatusColor(
                          o.status
                        )}`}
                      >
                        {getOrderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--brand-text)]">
                      {o.paymentStatus === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </td>
                    <td className="p-3 font-bold text-[var(--brand-olive)]">
                      {formatCurrency(o.totalAmount)}
                    </td>
                    <td className="p-3 text-[var(--brand-text-muted)]">
                      {new Date(o.createdAt).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}