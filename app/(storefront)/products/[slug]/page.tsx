import axios from "axios";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Baby, Tag, Package, Leaf, ShieldCheck, Truck, Star } from "lucide-react";
import { getProductBySlug, getProducts } from "@/features/products/api";
import ProductGallery from "@/features/products/components/ProductGallery";
import ProductVariantSelector from "@/features/products/components/ProductVariantSelector";
import ProductReviews from "@/features/products/components/ProductReviews";
import ProductCard from "@/features/products/components/ProductCard";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

const TRUST_STRIP = [
  { icon: Leaf, label: "100% Organic" },
  { icon: ShieldCheck, label: "Bác sĩ nhi khuyên dùng" },
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
    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* ===== Breadcrumb ===== */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)] mb-6">
        <Link href="/" className="hover:text-[var(--brand-olive)] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <Link href="/products" className="hover:text-[var(--brand-olive)] transition-colors">
          Sản phẩm
        </Link>
        <ChevronRight size={12} />
        <span className="text-[var(--brand-text)] truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12">
        <ProductGallery images={product.images} productName={product.name} />

        <div>
          <span className="inline-block bg-[var(--brand-yellow)] text-[var(--brand-olive-dark)] text-xs font-semibold px-3 py-1 rounded-full">
            {product.ageRangeMinMonths}-{product.ageRangeMaxMonths} tháng tuổi
          </span>

          <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-[var(--brand-text)] mt-4">
            {product.name}
          </h1>
          {product.brand && (
            <p className="text-sm text-[var(--brand-text-muted)] mt-1">{product.brand}</p>
          )}

          {product.reviewCount > 0 && product.averageRating !== null && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex text-[var(--brand-olive)]">
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
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="rounded-xl border border-[var(--brand-border)] bg-white p-3 text-center">
              <Baby size={18} className="mx-auto text-[var(--brand-olive)]" />
              <p className="text-xs text-[var(--brand-text-muted)] mt-1.5">Độ tuổi</p>
              <p className="text-sm font-semibold text-[var(--brand-text)]">
                {product.ageRangeMinMonths}-{product.ageRangeMaxMonths}th
              </p>
            </div>
            <div className="rounded-xl border border-[var(--brand-border)] bg-white p-3 text-center">
              <Tag size={18} className="mx-auto text-[var(--brand-olive)]" />
              <p className="text-xs text-[var(--brand-text-muted)] mt-1.5">Thương hiệu</p>
              <p className="text-sm font-semibold text-[var(--brand-text)] truncate">
                {product.brand ?? "Đang cập nhật"}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--brand-border)] bg-white p-3 text-center">
              <Package size={18} className="mx-auto text-[var(--brand-olive)]" />
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
                <item.icon size={18} className="text-[var(--brand-olive)]" />
                <p className="text-[11px] text-[var(--brand-text-muted)] leading-tight">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} />

      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading text-lg font-bold text-[var(--brand-olive)] mb-6">
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