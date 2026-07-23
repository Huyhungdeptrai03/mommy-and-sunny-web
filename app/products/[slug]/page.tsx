import axios from "axios";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/features/products/api";
import ProductGallery from "@/features/products/components/ProductGallery";
import ProductVariantSelector from "@/features/products/components/ProductVariantSelector";
import ProductCard from "@/features/products/components/ProductCard";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

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

  // Gợi ý sản phẩm liên quan — đơn giản hóa cho MVP: lấy vài sản phẩm khác cùng danh sách,
  // chưa lọc theo cùng danh mục vì getProducts() hiện chưa hỗ trợ filter phía FE
  const allProducts = await getProducts();
  const relatedProducts = allProducts.items.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
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

          {product.description && (
            <p className="mt-4 text-[var(--brand-text)] leading-relaxed">{product.description}</p>
          )}

          <div className="mt-8">
            <ProductVariantSelector variants={product.variants} />
          </div>
        </div>
      </div>

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