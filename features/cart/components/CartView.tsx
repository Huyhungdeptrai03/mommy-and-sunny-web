"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getCart, updateCartItem, removeCartItem } from "@/features/cart/api";
import { formatCurrency } from "@/lib/utils";
import { Cart } from "@/types/cart";

export default function CartView() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setItemCount = useCartStore((state) => state.setItemCount);

  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    void loadCart();
  }, [isAuthenticated]);

  useEffect(() => {
    if (cart) {
      const map: Record<string, number> = {};
      cart.items.forEach((item) => {
        map[item.itemId] = item.quantity;
      });
      setQuantities(map);
    }
  }, [cart]);

  async function loadCart() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getCart();
      setCart(data);
      setItemCount(data.items.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      setError("Không thể tải giỏ hàng, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCommitQuantity(itemId: string, currentQuantity: number) {
    const newQuantity = quantities[itemId];
    if (!newQuantity || newQuantity === currentQuantity) return;

    setPendingItemId(itemId);
    setError(null);
    try {
      const data = await updateCartItem(itemId, newQuantity);
      setCart(data);
      setItemCount(data.items.reduce((sum, item) => sum + item.quantity, 0));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Đã có lỗi xảy ra, vui lòng thử lại");
      }
      await loadCart();
    } finally {
      setPendingItemId(null);
    }
  }

  async function handleRemove(itemId: string) {
    setPendingItemId(itemId);
    setError(null);
    try {
      await removeCartItem(itemId);
      await loadCart();
    } catch {
      setError("Không thể xóa sản phẩm, vui lòng thử lại");
    } finally {
      setPendingItemId(null);
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Bạn cần đăng nhập để xem giỏ hàng.</p>
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

  if (!cart || cart.items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Giỏ hàng của bạn đang trống.</p>
        <Link
          href="/"
          className="mt-4 inline-block bg-[var(--brand-olive)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Tiếp tục mua sắm
        </Link>
      </main>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] mb-8">
        Giỏ hàng
      </h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div
            key={item.itemId}
            className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${
              !item.isAvailable
                ? "border-red-300 bg-red-50"
                : "border-[var(--brand-border)] bg-white"
            }`}
          >
            <div className="flex-1">
              <p className="font-heading font-semibold text-[var(--brand-text)]">
                {item.productName}
              </p>
              <p className="text-sm text-[var(--brand-text-muted)]">
                {[item.size, item.color].filter(Boolean).join(" - ")}
              </p>
              <p className="text-sm font-bold text-[var(--brand-olive)] mt-1">
                {formatCurrency(item.unitPrice)}
              </p>
              {item.warning && <p className="text-sm text-red-600 mt-1">{item.warning}</p>}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={item.availableQuantity}
                value={quantities[item.itemId] ?? item.quantity}
                disabled={pendingItemId === item.itemId}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [item.itemId]: Math.max(1, Number(e.target.value)),
                  }))
                }
                onBlur={() => handleCommitQuantity(item.itemId, item.quantity)}
                className="w-16 border border-[var(--brand-border)] rounded-xl px-2 py-2 text-center"
              />
              <button
                onClick={() => handleRemove(item.itemId)}
                disabled={pendingItemId === item.itemId}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-[var(--brand-border)] pt-6 flex items-center justify-between">
        <p className="font-heading text-lg font-bold text-[var(--brand-text)]">Tạm tính</p>
        <p className="font-heading text-lg font-extrabold text-[var(--brand-olive)]">
          {formatCurrency(cart.subTotal)}
        </p>
      </div>

      {hasUnavailableItems ? (
        <p className="mt-6 text-sm text-red-600 text-center">
          Vui lòng xóa các sản phẩm hết hàng trước khi đặt hàng
        </p>
      ) : (
        <Link
          href="/checkout"
          className="mt-6 block text-center bg-[var(--brand-olive)] text-white font-semibold py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          Tiến hành đặt hàng
        </Link>
      )}
    </main>
  );
}