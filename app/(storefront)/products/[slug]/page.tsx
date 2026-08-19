import axios from "axios";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Baby, Tag, Package, Gem, ShieldCheck, Truck, Star, Ship } from "lucide-react";
import { getProductBySlug, getProducts } from "@/features/products/api";
import ProductGallery from "@/features/products/components/ProductGallery";
import ProductVariantSelector from "@/features/products/components/ProductVariantSelector";
import ProductReviews from "@/features/products/components/ProductReviews";
import ProductCard from "@/features/products/components/ProductCard";
import WishlistButton from "@/features/wishlist/components/WishlistButton";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

const TRUST_STRIP = [
  { icon: Gem, label: "Giám tuyển kỹ càng" },
  { icon: ShieldCheck, label: "Chính hãng, xác thực" },
  { icon: Truck, label: "Giao hàng nhanh" },
];

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    const isNotFoundFromApi = axios.isAxiosError(error) && error.response?.status === 404;
    const isInvalidSlug = error instanceof Error && error.message.startsWith("Slug không hợp lệ");

    if (isNotFoundFromApi || isInvalidSlug) {
      notFound();
    }
    throw error;
  }

  const allProducts = await getProducts();
  const relatedProducts = allProducts.items.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <main className="px-6 md:px-12 py-10">
      {/* ===== Breadcrumb ===== */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)] mb-8">
        <Link href="/" className="hover:text-[var(--brand-text)] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <Link href="/products" className="hover:text-[var(--brand-text)] transition-colors">
          Sản phẩm
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--brand-text)] truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-16">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          {product.purchaseBatchName && (
            <div className="flex items-start gap-3 border border-[var(--brand-border)] p-4 mb-4">
              <Ship size={20} className="text-[var(--brand-text)] shrink-0 mt-0.5" />
              <div>
                <p className="font-heading font-semibold text-[var(--brand-text)]">
                  Sản phẩm đặt trước — {product.purchaseBatchName}
                </p>
                <p className="text-sm text-[var(--brand-text-muted)] mt-0.5">
                  Đây là hàng xách tay theo đợt, chưa có sẵn tại kho.
                  {product.estimatedArrivalDate
                    ? ` Dự kiến về hàng khoảng ${new Date(product.estimatedArrivalDate).toLocaleDateString("vi-VN")}.`
                    : " Thời gian nhận hàng sẽ lâu hơn sản phẩm có sẵn thông thường."}
                </p>
              </div>
            </div>
          )}

          {product.ageRangeMinMonths !== null && product.ageRangeMaxMonths !== null && (
            <span className="inline-block border border-[var(--brand-border)] text-[var(--brand-text-muted)] text-xs font-semibold uppercase tracking-wide px-3 py-1">
              {product.ageRangeMinMonths}-{product.ageRangeMaxMonths} tháng tuổi
            </span>
          )}

          <div className="flex items-start justify-between gap-3 mt-4">
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-[var(--brand-text)] leading-tight">
              {product.name}
            </h1>
            <WishlistButton
              productId={product.id}
              size={20}
              className="w-11 h-11 border border-[var(--brand-border)] hover:border-[var(--brand-text)] shrink-0"
            />
          </div>
          {product.brand && (
            <p className="text-sm text-[var(--brand-text-muted)] mt-1">{product.brand}</p>
          )}

          {product.reviewCount > 0 && product.averageRating !== null && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex text-[var(--brand-accent)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < Math.round(product.averageRating!) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <span className="text-sm text-[var(--brand-text-muted)]">
                {product.averageRating.toFixed(1)} ({product.reviewCount} đánh giá)
              </span>
            </div>
          )}

          {product.description && (
            <p className="mt-4 text-[var(--brand-text)] leading-relaxed">{product.description}</p>
          )}

          {/* ===== Thông tin sản phẩm — dữ liệu thật, có icon ===== */}
          <div
            className={`grid gap-px bg-[var(--brand-border)] border border-[var(--brand-border)] mt-6 ${
              product.ageRangeMinMonths !== null ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            {product.ageRangeMinMonths !== null && product.ageRangeMaxMonths !== null && (
              <div className="bg-white p-3 text-center">
                <Baby size={18} className="mx-auto text-[var(--brand-text)]" />
                <p className="text-xs text-[var(--brand-text-muted)] mt-1.5">Độ tuổi</p>
                <p className="text-sm font-semibold text-[var(--brand-text)]">
                  {product.ageRangeMinMonths}-{product.ageRangeMaxMonths}th
                </p>
              </div>
            )}
            <div className="bg-white p-3 text-center">
              <Tag size={18} className="mx-auto text-[var(--brand-text)]" />
              <p className="text-xs text-[var(--brand-text-muted)] mt-1.5">Thương hiệu</p>
              <p className="text-sm font-semibold text-[var(--brand-text)] truncate">
                {product.brand ?? "Đang cập nhật"}
              </p>
            </div>
            <div className="bg-white p-3 text-center">
              <Package size={18} className="mx-auto text-[var(--brand-text)]" />
              <p className="text-xs text-[var(--brand-text-muted)] mt-1.5">Phiên bản</p>
              <p className="text-sm font-semibold text-[var(--brand-text)]">
                {product.variants.length} loại
              </p>
            </div>
          </div>

          <div className="mt-8">
            <ProductVariantSelector variants={product.variants} />
          </div>

          {/* ===== Dải cam kết — cùng nội dung với trang chủ, thu nhỏ lại ===== */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-[var(--brand-border)]">
            {TRUST_STRIP.map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center gap-1.5 flex-1">
                <item.icon size={18} className="text-[var(--brand-text)]" />
                <p className="text-[11px] text-[var(--brand-text-muted)] leading-tight">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {product.specifications.length > 0 && (
        <section className="mt-16 max-w-2xl">
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-6">
            Thông số sản phẩm
          </h2>
          <div className="border border-[var(--brand-border)] divide-y divide-[var(--brand-border)]">
            {product.specifications.map((spec, idx) => (
              <div key={idx} className="flex items-center px-4 py-3 text-sm">
                <span className="w-40 shrink-0 text-[var(--brand-text-muted)]">{spec.label}</span>
                <span className="text-[var(--brand-text)] font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <ProductReviews productId={product.id} />

      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-6">
            Có thể bạn cũng thích
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}