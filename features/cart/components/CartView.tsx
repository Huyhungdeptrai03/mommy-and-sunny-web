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

  async function handleQuantityChange(itemId: string, currentQuantity: number, targetQuantity: number) {
    setQuantities((prev) => ({ ...prev, [itemId]: targetQuantity }));
    if (targetQuantity === currentQuantity || targetQuantity < 1) return;

    setPendingItemId(itemId);
    setError(null);
    try {
      const data = await updateCartItem(itemId, targetQuantity);
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
          className="mt-4 inline-block bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 hover:bg-black transition-colors"
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
          className="mt-4 inline-block bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 hover:bg-black transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </main>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);

  return (
    <main className="px-6 md:px-12 py-12 max-w-3xl">
      <h1 className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--brand-text)] mb-10">
        Giỏ hàng
      </h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      <div className="divide-y divide-[var(--brand-border)]">
        {cart.items.map((item) => (
          <div
            key={item.itemId}
            className={`flex items-center gap-4 py-5 ${!item.isAvailable ? "opacity-60" : ""}`}
          >
            <div className="w-20 h-20 bg-[var(--brand-cream-dark)] overflow-hidden shrink-0">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)] text-[10px]">
                  Chưa có ảnh
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-heading font-semibold text-[var(--brand-text)] truncate">
                {item.productName}
              </p>
              <p className="text-sm text-[var(--brand-text-muted)]">
                {[item.size, item.color].filter(Boolean).join(" - ")}
              </p>
              <p className="text-sm font-bold text-[var(--brand-text)] mt-1">
                {formatCurrency(item.unitPrice)}
              </p>
              {item.warning && <p className="text-sm text-red-600 mt-1">{item.warning}</p>}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Nút +/- thân thiện hơn ô nhập số thô — vẫn commit lúc rời khỏi ô nếu gõ tay */}
              <div className="flex items-center gap-1 border border-[var(--brand-border)] px-1 py-1">
                <button
                  onClick={() =>
                    handleQuantityChange(
                      item.itemId,
                      item.quantity,
                      Math.max(1, (quantities[item.itemId] ?? item.quantity) - 1)
                    )
                  }
                  disabled={pendingItemId === item.itemId}
                  className="w-7 h-7 flex items-center justify-center text-[var(--brand-text)] hover:bg-[var(--brand-cream-dark)] transition-colors disabled:opacity-50"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-semibold text-[var(--brand-text)]">
                  {quantities[item.itemId] ?? item.quantity}
                </span>
                <button
                  onClick={() =>
                    handleQuantityChange(
                      item.itemId,
                      item.quantity,
                      Math.min(item.availableQuantity, (quantities[item.itemId] ?? item.quantity) + 1)
                    )
                  }
                  disabled={pendingItemId === item.itemId}
                  className="w-7 h-7 flex items-center justify-center text-[var(--brand-text)] hover:bg-[var(--brand-cream-dark)] transition-colors disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => handleRemove(item.itemId)}
                disabled={pendingItemId === item.itemId}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-[var(--brand-border)] flex items-center justify-between">
        <p className="text-[var(--brand-text-muted)]">Tạm tính</p>
        <p className="font-heading text-3xl font-extrabold text-[var(--brand-text)]">
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
          className="mt-6 block text-center bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest py-3.5 hover:bg-black transition-colors"
        >
          Tiến hành đặt hàng
        </Link>
      )}
    </main>
  );
}