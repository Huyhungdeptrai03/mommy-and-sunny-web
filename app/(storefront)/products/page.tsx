import { getProducts } from "@/features/products/api";
import ProductCard from "@/features/products/components/ProductCard";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    categorySlug?: string;
    ageMonths?: string;
    purchaseBatchId?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const ageMonths = params.ageMonths ? Number(params.ageMonths) : undefined;

  const result = await getProducts({
    search: params.search,
    categorySlug: params.categorySlug,
    ageMonths,
    purchaseBatchId: params.purchaseBatchId,
  });

  let heading = "Tất cả sản phẩm";
  if (params.search) {
    heading = `Kết quả tìm kiếm cho "${params.search}"`;
  } else if (params.purchaseBatchId) {
    heading = "Sản phẩm đặt trước thuộc đợt hàng";
  } else if (ageMonths !== undefined) {
    heading = `Sản phẩm phù hợp ${ageMonths} tháng tuổi`;
  }

  return (
    <main className="px-6 md:px-12 py-12">
      {/* ===== Editorial (5%) — tiêu đề cỡ lớn, không viền/không nền, đúng 1 điểm nhấn của trang ===== */}
      <div className="max-w-2xl mb-12">
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-[var(--brand-text)] leading-tight">
          {heading}
        </h1>
        <p className="text-sm text-[var(--brand-text-muted)] mt-3">
          {result.totalCount} sản phẩm
        </p>
      </div>

      {/* ===== Lưới sản phẩm — CỐ Ý giữ đều nhau, không áp Bento, để so sánh công bằng ===== */}
      {result.items.length === 0 ? (
        <p className="text-[var(--brand-text-muted)]">
          Không tìm thấy sản phẩm nào phù hợp.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}