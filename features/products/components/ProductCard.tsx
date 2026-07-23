import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ProductListItem } from "@/types/product";

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block bg-white rounded-2xl border border-[var(--brand-border)] overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-[var(--brand-cream-dark)] overflow-hidden">
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
      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-[var(--brand-text-muted)] uppercase tracking-wide">
            {product.brand}
          </p>
        )}
        <h3 className="font-heading font-semibold text-[var(--brand-text)] mt-1 line-clamp-2">
          {product.name}
        </h3>
        <p className="mt-2 font-bold text-[var(--brand-olive)]">
          {formatCurrency(product.minPrice)}
          {product.minPrice !== product.maxPrice && ` - ${formatCurrency(product.maxPrice)}`}
        </p>
      </div>
    </Link>
  );
}