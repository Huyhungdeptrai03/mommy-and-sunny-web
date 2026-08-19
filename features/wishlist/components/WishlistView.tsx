"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getMyWishlist, removeFromWishlist } from "@/features/wishlist/api";
import { useWishlistStore } from "@/store/wishlistStore";
import { formatCurrency } from "@/lib/utils";
import { WishlistItem } from "@/types/wishlist";

export default function WishlistView() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const remove = useWishlistStore((s) => s.remove);

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
      const data = await getMyWishlist();
      setItems(data);
    } catch {
      setError("Không thể tải danh sách yêu thích");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemove(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    remove(productId);
    try {
      await removeFromWishlist(productId);
    } catch {
      await load();
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Bạn cần đăng nhập để xem yêu thích.</p>
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
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="px-6 md:px-12 py-12 max-w-5xl mx-auto">
      <h1 className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--brand-text)] mb-10">
        Sản phẩm yêu thích
      </h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={40} className="mx-auto text-[var(--brand-border)] mb-4" />
          <p className="text-[var(--brand-text-muted)] mb-6">
            Chưa có sản phẩm nào trong danh sách yêu thích.
          </p>
          <Link
            href="/products"
            className="inline-block bg-[var(--brand-olive)] text-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {items.map((item) => (
            <div key={item.productId} className={!item.isAvailable ? "opacity-50" : ""}>
              <Link href={`/products/${item.productSlug}`} className="group block">
                <div className="aspect-square bg-[var(--brand-cream-dark)] overflow-hidden relative">
                  {item.purchaseBatchName && (
                    <span className="absolute top-0 left-0 z-10 bg-[var(--brand-olive)] text-white text-[10px] font-bold px-2.5 py-1.5 tracking-wide">
                      Đặt trước
                    </span>
                  )}
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)] text-sm">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div className="pt-3">
                  <h3 className="font-heading font-semibold text-[var(--brand-text)] line-clamp-2">
                    {item.productName}
                  </h3>
                  <p className="mt-1 font-bold text-[var(--brand-text)]">
                    {formatCurrency(item.minPrice)}
                    {item.minPrice !== item.maxPrice && ` - ${formatCurrency(item.maxPrice)}`}
                  </p>
                  {!item.isAvailable && (
                    <p className="text-xs text-red-600 mt-1">Sản phẩm ngừng bán</p>
                  )}
                </div>
              </Link>
              <button
                onClick={() => handleRemove(item.productId)}
                className="mt-2 text-xs text-[var(--brand-text-muted)] hover:text-red-600"
              >
                Bỏ khỏi yêu thích
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}