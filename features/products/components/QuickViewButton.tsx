"use client";

import { useState, MouseEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Eye, X, Star } from "lucide-react";
import { getProductBySlug } from "@/features/products/api";
import { Product } from "@/types/product";
import { formatCurrency } from "@/lib/utils";

// Nút "Xem nhanh" nằm trong ProductCard (bên trong thẻ <Link> của cả card) — click phải
// preventDefault + stopPropagation để không bị điều hướng theo link cha. Modal render qua
// portal ra document.body để thoát khỏi thẻ <a> (không hợp lệ nếu lồng nội dung tương tác
// bên trong <a>), nhưng vẫn phải tự chặn bubbling ở gốc modal vì React re-bubble theo cây
// component chứ không theo cây DOM thật.
export default function QuickViewButton({ slug, className }: { slug: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState(false);

  function handleOpen(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    if (!product) {
      setLoading(true);
      setError(false);
      getProductBySlug(slug)
        .then(setProduct)
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }
  }

  function handleClose(e?: MouseEvent) {
    e?.stopPropagation();
    setOpen(false);
  }

  const minPrice = product ? Math.min(...product.variants.map((v) => v.price)) : 0;
  const maxPrice = product ? Math.max(...product.variants.map((v) => v.price)) : 0;

  return (
    <>
      <button type="button" onClick={handleOpen} aria-label="Xem nhanh" className={className}>
        <Eye size={16} />
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={handleClose}
          >
            <div
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handleClose}
                aria-label="Đóng"
                className="absolute right-4 top-4 text-[var(--brand-text-muted)] transition-colors hover:text-[var(--brand-text)]"
              >
                <X size={18} />
              </button>

              {loading ? (
                <p className="py-16 text-center text-sm text-[var(--brand-text-muted)]">Đang tải...</p>
              ) : error || !product ? (
                <p className="py-16 text-center text-sm text-[var(--brand-text-muted)]">
                  Không tải được thông tin sản phẩm.
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="aspect-square overflow-hidden bg-[var(--brand-cream-dark)]">
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    {product.brand && (
                      <p className="text-[10px] uppercase tracking-widest text-[var(--brand-text-muted)]">
                        {product.brand}
                      </p>
                    )}
                    <h3 className="font-heading mt-1 text-lg font-semibold text-[var(--brand-text)]">
                      {product.name}
                    </h3>

                    {product.reviewCount > 0 && product.averageRating != null && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="flex gap-0.5 text-[var(--brand-accent)]">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              fill={i < Math.round(product.averageRating!) ? "currentColor" : "none"}
                              className={i < Math.round(product.averageRating!) ? "" : "text-[var(--brand-border)]"}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-[var(--brand-text-muted)]">({product.reviewCount})</span>
                      </div>
                    )}

                    <p className="mt-3 font-bold text-[var(--brand-text)]">
                      {formatCurrency(minPrice)}
                      {minPrice !== maxPrice && ` - ${formatCurrency(maxPrice)}`}
                    </p>

                    {product.description && (
                      <p className="mt-3 text-sm leading-relaxed text-[var(--brand-text-muted)] line-clamp-3">
                        {product.description}
                      </p>
                    )}

                    <Link
                      href={`/products/${product.slug}`}
                      onClick={() => handleClose()}
                      className="mt-5 inline-flex items-center gap-2 bg-[var(--brand-olive)] px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                    >
                      Xem chi tiết đầy đủ
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
