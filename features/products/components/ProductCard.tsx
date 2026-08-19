import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ProductListItem } from "@/types/product";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

export default function ProductCard({ product }: { product: ProductListItem }) {
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
          className="absolute top-2 right-2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm hover:bg-white"
        />
        {product.primaryImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)] text-sm">
            Chưa có ảnh
          </div>
        )}
      </div>
      <div className="pt-3">
        {product.brand && (
          <p className="text-[10px] text-[var(--brand-text-muted)] uppercase tracking-widest">
            {product.brand}
          </p>
        )}
        <h3 className="font-heading text-sm font-medium text-[var(--brand-text)] mt-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-2 font-bold text-[var(--brand-text)]">
          {formatCurrency(product.minPrice)}
          {product.minPrice !== product.maxPrice && ` - ${formatCurrency(product.maxPrice)}`}
        </p>
      </div>
    </Link>
  );
}
