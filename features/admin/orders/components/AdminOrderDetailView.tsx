"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { getAdminOrderById, updateOrderStatus } from "@/features/admin/orders/api";
import { formatCurrency, getOrderStatusLabel, getOrderStatusColor } from "@/lib/utils";
import { AdminOrderDetail } from "@/types/adminOrder";

const VALID_TRANSITIONS: Record<string, string[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipping", "Cancelled"],
  Shipping: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

export default function AdminOrderDetailView() {
  const params = useParams<{ id: string }>();

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminOrderById(params.id);
      setOrder(data);
    } catch {
      setError("Không thể tải chi tiết đơn hàng");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangeStatus(toStatus: string) {
    if (toStatus === "Cancelled" && !confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) {
      return;
    }

    setIsUpdating(true);
    setError(null);
    try {
      await updateOrderStatus(params.id, toStatus, note || undefined);
      setNote("");
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể cập nhật trạng thái");
      }
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  if (!order) {
    return (
      <main className="p-8 text-center">
        <p className="text-red-600">{error ?? "Không tìm thấy đơn hàng"}</p>
        <Link
          href="/admin/orders"
          className="mt-3 inline-block text-[var(--brand-olive)] font-medium underline"
        >
          Quay lại danh sách
        </Link>
      </main>
    );
  }

  const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];

  return (
    <main className="p-8 max-w-2xl">
      <Link href="/admin/orders" className="text-sm text-[var(--brand-text-muted)] hover:underline">
        ← Quay lại danh sách đơn hàng
      </Link>

      <div className="flex items-center justify-between mt-4 mb-2">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
          {order.orderCode}
        </h1>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${getOrderStatusColor(
            order.status
          )}`}
        >
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      <p className="text-sm text-[var(--brand-text-muted)] mb-6">
        {order.customerName} — {order.customerEmail}
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      <section className="mb-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-2">
          Địa chỉ giao hàng
        </h2>
        <p className="text-sm text-[var(--brand-text)]">
          {order.recipientName} — {order.recipientPhone}
        </p>
        <p className="text-sm text-[var(--brand-text-muted)]">{order.shippingAddress}</p>
        {order.customerNote && (
          <p className="text-sm text-[var(--brand-text-muted)] mt-1">
            Ghi chú khách: {order.customerNote}
          </p>
        )}
      </section>

      <section className="mb-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-2">Sản phẩm</h2>
        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] bg-white p-4"
            >
              <div>
                <p className="font-medium text-[var(--brand-text)]">{item.productName}</p>
                {item.variantDescription && (
                  <p className="text-sm text-[var(--brand-text-muted)]">
                    {item.variantDescription}
                  </p>
                )}
                <p className="text-sm text-[var(--brand-text-muted)]">
                  {formatCurrency(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="font-bold text-[var(--brand-olive)]">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 border-t border-[var(--brand-border)] pt-4">
        <div className="flex justify-between font-heading text-lg font-bold text-[var(--brand-text)]">
          <span>Tổng cộng</span>
          <span className="text-[var(--brand-olive)]">{formatCurrency(order.totalAmount)}</span>
        </div>
        <p className="text-sm text-[var(--brand-text-muted)] mt-1">
          Thanh toán: {order.paymentMethod} —{" "}
          {order.paymentStatus === "Paid" ? "Đã thanh toán" : "Chưa thanh toán"}
        </p>
      </section>

      <section className="mb-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-2">
          Lịch sử đơn hàng
        </h2>
        <div className="space-y-3">
          {order.statusHistory.map((h, idx) => (
            <div key={idx} className="text-sm border-l-2 border-[var(--brand-border)] pl-3">
              <p className="font-medium text-[var(--brand-text)]">
                {getOrderStatusLabel(h.toStatus)}
              </p>
              {h.note && <p className="text-[var(--brand-text-muted)]">{h.note}</p>}
              <p className="text-[var(--brand-text-muted)]">
                {new Date(h.changedAt).toLocaleString("vi-VN")}
              </p>
            </div>
          ))}
        </div>
      </section>

      {nextStatuses.length > 0 && (
        <section className="border-t border-[var(--brand-border)] pt-4">
          <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-2">
            Chuyển trạng thái
          </h2>
          <textarea
            placeholder="Ghi chú (không bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full border border-[var(--brand-border)] rounded-xl px-4 py-2 text-sm mb-3 bg-white focus:outline-none focus:border-[var(--brand-olive)]"
          />
          <div className="flex gap-3">
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleChangeStatus(status)}
                disabled={isUpdating}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-opacity disabled:opacity-50 ${
                  status === "Cancelled"
                    ? "border-2 border-red-300 text-red-600 hover:bg-red-50"
                    : "bg-[var(--brand-olive)] text-white hover:opacity-90"
                }`}
              >
                {getOrderStatusLabel(status)}
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}