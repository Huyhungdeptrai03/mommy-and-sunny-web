"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getCart, updateCartItem, removeCartItem } from "@/features/cart/api";
import { formatCurrency } from "@/lib/utils";
import { Cart } from "@/types/cart";

// Vận chuyển hiện đang miễn phí toàn bộ đơn hàng ở backend (OrderService — MVP, tính phí
// thật để Tier 2) — hiển thị đúng thực tế này, KHÔNG bịa ngưỡng "miễn phí từ X đồng"
const SUMMARY_PERKS = [
  { icon: Truck, text: "Miễn phí vận chuyển toàn bộ đơn hàng" },
  { icon: RotateCcw, text: "Đổi trả trong 7 ngày nếu lỗi từ shop" },
  { icon: ShieldCheck, text: "Thanh toán an toàn, bảo mật" },
];

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
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-cream-dark)] text-[var(--brand-text)]">
          <ShoppingBag size={26} />
        </div>
        <h1 className="font-heading text-xl font-bold uppercase tracking-tight text-[var(--brand-text)]">
          Bạn cần đăng nhập
        </h1>
        <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
          Đăng nhập để xem giỏ hàng và tiếp tục mua sắm.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 hover:bg-black transition-colors"
        >
          Đăng nhập
        </Link>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="px-6 md:px-12 py-12 max-w-6xl mx-auto">
        <div className="h-9 w-48 bg-[var(--brand-cream-dark)] animate-pulse mb-10" />
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-5 border-b border-[var(--brand-border)] pb-6">
                <div className="h-24 w-24 shrink-0 bg-[var(--brand-cream-dark)] animate-pulse" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-2/3 bg-[var(--brand-cream-dark)] animate-pulse" />
                  <div className="h-3 w-1/3 bg-[var(--brand-cream-dark)] animate-pulse" />
                  <div className="h-4 w-1/4 bg-[var(--brand-cream-dark)] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-64 bg-[var(--brand-cream-dark)] animate-pulse" />
        </div>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-cream-dark)] text-[var(--brand-text)]">
          <ShoppingBag size={26} />
        </div>
        <h1 className="font-heading text-xl font-bold uppercase tracking-tight text-[var(--brand-text)]">
          Giỏ hàng đang trống
        </h1>
        <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
          Hãy khám phá các sản phẩm nhập khẩu chính hãng của Crab Be Bé.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest px-6 py-3.5 hover:bg-black transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </main>
    );
  }

  const hasUnavailableItems = cart.items.some((item) => !item.isAvailable);
  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="px-6 md:px-12 py-12 max-w-6xl mx-auto">
      {/* Breadcrumb — cho cảm giác đang ở đúng 1 bước trong hành trình mua hàng, không phải trang rời rạc */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)]">
        <Link href="/" className="hover:text-[var(--brand-text)] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <span className="font-medium text-[var(--brand-text)]">Giỏ hàng</span>
      </nav>

      <div className="mb-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--brand-text)]">
            Giỏ hàng
          </h1>
          <p className="mt-1 text-sm text-[var(--brand-text-muted)]">
            {totalQuantity} sản phẩm trong giỏ hàng của bạn
          </p>
        </div>
        <Link
          href="/products"
          className="text-xs font-medium uppercase tracking-widest text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors"
        >
          Tiếp tục mua sắm
        </Link>
      </div>

      {error && (
        <p className="mb-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          <AlertTriangle size={15} className="shrink-0" />
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-10 items-start">
        {/* ===== Danh sách sản phẩm ===== */}
        <div className="lg:col-span-2 divide-y divide-[var(--brand-border)] border-t border-b border-[var(--brand-border)]">
          {cart.items.map((item) => {
            const quantity = quantities[item.itemId] ?? item.quantity;
            const isPending = pendingItemId === item.itemId;
            return (
              <div
                key={item.itemId}
                className={`flex flex-wrap gap-5 py-6 sm:flex-nowrap ${!item.isAvailable ? "opacity-60" : ""}`}
              >
                <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-[var(--brand-cream-dark)]">
                  {item.purchaseBatchName && (
                    <span className="absolute top-0 left-0 z-10 bg-[var(--brand-olive)] text-white text-[9px] font-bold px-1.5 py-1 tracking-wide">
                      Đặt trước
                    </span>
                  )}
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--brand-text-muted)]">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-[var(--brand-text)]">
                    {item.productName}
                  </p>
                  {(item.size || item.color) && (
                    <p className="mt-1 inline-block border border-[var(--brand-border)] px-2 py-0.5 text-xs text-[var(--brand-text-muted)]">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-[var(--brand-text-muted)]">
                    {formatCurrency(item.unitPrice)}{" "}
                    <span className="text-[var(--brand-text-muted)]">/ sản phẩm</span>
                  </p>
                  {item.warning && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600">
                      <AlertTriangle size={13} className="shrink-0" />
                      {item.warning}
                    </p>
                  )}

                  {/* Bậc thang số lượng + xóa — gộp xuống hàng dưới trên mobile */}
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center border border-[var(--brand-border)]">
                      <button
                        onClick={() =>
                          handleQuantityChange(item.itemId, item.quantity, Math.max(1, quantity - 1))
                        }
                        disabled={isPending || quantity <= 1}
                        aria-label="Giảm số lượng"
                        className="flex h-8 w-8 items-center justify-center text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-cream-dark)] disabled:opacity-30"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-9 text-center text-sm font-semibold text-[var(--brand-text)]">
                        {quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item.itemId,
                            item.quantity,
                            Math.min(item.availableQuantity, quantity + 1)
                          )
                        }
                        disabled={isPending || quantity >= item.availableQuantity}
                        aria-label="Tăng số lượng"
                        className="flex h-8 w-8 items-center justify-center text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-cream-dark)] disabled:opacity-30"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemove(item.itemId)}
                      disabled={isPending}
                      aria-label="Xóa sản phẩm"
                      className="flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)] transition-colors hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Xóa
                    </button>
                  </div>
                </div>

                <div className="w-full text-right sm:w-auto sm:min-w-[110px]">
                  <p className="font-heading text-lg font-bold text-[var(--brand-text)]">
                    {formatCurrency(item.unitPrice * quantity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== Tóm tắt đơn hàng — cố định khi cuộn, đúng bố cục của 1 trang giỏ hàng hoàn chỉnh ===== */}
        <aside className="border border-[var(--brand-border)] bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-[var(--brand-text)] mb-5">
            Tóm tắt đơn hàng
          </h2>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--brand-text-muted)]">Tạm tính ({totalQuantity} sản phẩm)</span>
              <span className="font-medium text-[var(--brand-text)]">{formatCurrency(cart.subTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--brand-text-muted)]">Phí vận chuyển</span>
              <span className="font-medium text-[var(--brand-olive)]">Miễn phí</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--brand-border)] pt-4">
            <span className="font-medium text-[var(--brand-text)]">Tổng cộng</span>
            <span className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
              {formatCurrency(cart.subTotal)}
            </span>
          </div>

          {hasUnavailableItems ? (
            <p className="mt-6 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
              <AlertTriangle size={14} className="shrink-0" />
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

          <ul className="mt-6 space-y-3 border-t border-[var(--brand-border)] pt-5">
            {SUMMARY_PERKS.map((perk) => (
              <li key={perk.text} className="flex items-center gap-2.5 text-xs text-[var(--brand-text-muted)]">
                <perk.icon size={15} className="shrink-0 text-[var(--brand-text)]" />
                {perk.text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
