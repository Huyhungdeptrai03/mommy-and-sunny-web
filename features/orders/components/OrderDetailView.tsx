"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { getOrderByCode, cancelOrder } from "@/features/orders/api";
import { formatCurrency, getOrderStatusLabel, getOrderStatusColor } from "@/lib/utils";
import { OrderDetail } from "@/types/order";

export default function OrderDetailView() {
  const params = useParams<{ orderCode: string }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const isCancellingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrderByCode(params.orderCode);
      setOrder(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        setError("Không tìm thấy đơn hàng");
      } else {
        setError("Không thể tải chi tiết đơn hàng");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel() {
    if (isCancellingRef.current) return;
    if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;

    isCancellingRef.current = true;
    setIsCancelling(true);
    setError(null);
    try {
      await cancelOrder(params.orderCode);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể hủy đơn hàng");
      }
    } finally {
      isCancellingRef.current = false;
      setIsCancelling(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Bạn cần đăng nhập để xem đơn hàng.</p>
      </main>
    );
  }

  if (isLoading) {
    return <main className="max-w-2xl mx-auto px-6 py-16 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  if (error || !order) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-red-600">{error ?? "Không tìm thấy đơn hàng"}</p>
        <Link
          href="/orders"
          className="mt-4 inline-block text-[var(--brand-olive)] font-medium underline"
        >
          Quay lại danh sách đơn hàng
        </Link>
      </main>
    );
  }

  const canCancel = order.status === "Pending" || order.status === "Confirmed";

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <Link href="/orders" className="text-sm text-[var(--brand-text-muted)] hover:underline">
        ← Quay lại danh sách đơn hàng
      </Link>

      <div className="flex items-center justify-between mt-5 mb-2">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--brand-text)]">
          {order.orderCode}
        </h1>
        <span
          className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 shrink-0 ml-3 ${getOrderStatusColor(
            order.status
          )}`}
        >
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 p-3">
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
      </section>

      <section className="mb-8">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-2">Sản phẩm</h2>
        <div className="divide-y divide-[var(--brand-border)]">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-[var(--brand-text)] flex items-center gap-2">
                  {item.productName}
                  {item.purchaseBatchName && (
                    <span className="text-[10px] font-bold bg-[var(--brand-olive)] text-white px-2 py-0.5 whitespace-nowrap">
                      Đặt trước · {item.purchaseBatchName}
                    </span>
                  )}
                </p>
                {item.variantDescription && (
                  <p className="text-sm text-[var(--brand-text-muted)]">
                    {item.variantDescription}
                  </p>
                )}
                <p className="text-sm text-[var(--brand-text-muted)]">
                  {formatCurrency(item.unitPrice)} × {item.quantity}
                </p>
              </div>
              <p className="font-bold text-[var(--brand-text)]">
                {formatCurrency(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 pt-2">
        {order.couponCode && (
          <div className="flex justify-between items-center text-sm text-red-600 mb-1">
            <span>Mã giảm giá ({order.couponCode})</span>
            <span>-{formatCurrency(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-[var(--brand-text-muted)]">Tổng cộng</span>
          <span className="font-heading text-3xl font-extrabold text-[var(--brand-text)]">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
        {order.depositAmount !== null && (
          <p className="text-sm text-[var(--brand-text-muted)] mt-1 text-right">
            Tiền cọc: {formatCurrency(order.depositAmount)} —{" "}
            {order.depositPaymentStatus === "Paid" ? "Đã thu" : "Chưa thu"}
          </p>
        )}
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

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="w-full border-2 border-red-300 text-red-600 py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {isCancelling ? "Đang hủy..." : "Hủy đơn hàng"}
        </button>
      )}
    </main>
  );
}