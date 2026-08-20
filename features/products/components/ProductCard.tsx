import Link from "next/link";
import { ShoppingBag, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductListItem } from "@/types/product";
import WishlistButton from "@/features/wishlist/components/WishlistButton";
import QuickViewButton from "@/features/products/components/QuickViewButton";

const ICON_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center bg-white text-[var(--brand-text)] shadow-lg transition-colors duration-200 hover:bg-[var(--brand-olive)] hover:text-white";

export default function ProductCard({ product }: { product: ProductListItem }) {
  const roundedRating = product.averageRating != null ? Math.round(product.averageRating) : 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-square bg-[var(--brand-cream-dark)] overflow-hidden relative">
        {product.purchaseBatchName && (
          <span className="absolute top-0 left-0 z-10 bg-[var(--brand-olive)] text-white text-[10px] font-bold px-2.5 py-1.5 tracking-wide">
            Đặt trước
          </span>
        )}
        <WishlistButton
          productId={product.id}
          size={15}
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm hover:bg-white transition-transform duration-300 group-hover:scale-105"
        />
        {product.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)] text-sm">
            Chưa có ảnh
          </div>
        )}

        {/* Lớp phủ tối nhẹ + 2 nút thao tác nhanh nổi lên giữa ảnh khi hover */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {/* Túi hàng — dẫn thẳng tới trang sản phẩm để chọn size/màu rồi thêm vào giỏ,
              vì giỏ hàng luôn cần chọn biến thể cụ thể, không thể thêm thẳng từ đây */}
          <span
            className={`${ICON_BUTTON_CLASS} translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100`}
          >
            <ShoppingBag size={16} />
          </span>
          <span className="translate-y-3 opacity-0 transition-all delay-75 duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <QuickViewButton slug={product.slug} className={ICON_BUTTON_CLASS} />
          </span>
        </div>
      </div>
      <div className="pt-3">
        {product.brand && (
          <p className="text-[10px] text-[var(--brand-text-muted)] uppercase tracking-widest">
            {product.brand}
          </p>
        )}
        <h3 className="font-heading text-sm font-medium text-[var(--brand-text)] mt-1 line-clamp-2 transition-colors duration-200 group-hover:text-[var(--brand-olive)]">
          {product.name}
        </h3>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-0.5 text-[var(--brand-accent)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                fill={i < roundedRating ? "currentColor" : "none"}
                className={i < roundedRating ? "" : "text-[var(--brand-border)]"}
              />
            ))}
          </div>
        )}
        <p className="mt-2 font-bold text-[var(--brand-text)]">
          {formatCurrency(product.minPrice)}
          {product.minPrice !== product.maxPrice && ` - ${formatCurrency(product.maxPrice)}`}
        </p>
      </div>
    </Link>
  );
}
