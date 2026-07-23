"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getMyOrders } from "@/features/orders/api";
import { formatCurrency, getOrderStatusLabel, getOrderStatusColor } from "@/lib/utils";
import { OrderListItem } from "@/types/order";

export default function OrderList() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    void load();
  }, [isAuthenticated]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getMyOrders();
      setOrders(result.items);
    } catch {
      setError("Không thể tải danh sách đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Bạn cần đăng nhập để xem đơn hàng.</p>
        <Link
          href="/login"
          className="mt-4 inline-block bg-[var(--brand-olive)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Đăng nhập
        </Link>
      </main>
    );
  }

  if (isLoading) {
    return <main className="max-w-2xl mx-auto px-6 py-16 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  if (error) {
    return <main className="max-w-2xl mx-auto px-6 py-16 text-red-600">{error}</main>;
  }

  if (orders.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Bạn chưa có đơn hàng nào.</p>
        <Link
          href="/"
          className="mt-4 inline-block bg-[var(--brand-olive)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Tiếp tục mua sắm
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] mb-8">
        Lịch sử đơn hàng
      </h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.orderCode}
            href={`/orders/${order.orderCode}`}
            className="block rounded-2xl border border-[var(--brand-border)] bg-white p-5 hover:border-[var(--brand-olive)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <p className="font-heading font-semibold text-[var(--brand-text)]">
                {order.orderCode}
              </p>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${getOrderStatusColor(
                  order.status
                )}`}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <p className="text-sm text-[var(--brand-text-muted)] mt-1">
              {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
            <p className="font-bold text-[var(--brand-olive)] mt-2">
              {formatCurrency(order.totalAmount)}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}