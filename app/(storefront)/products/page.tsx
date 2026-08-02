import { getProducts } from "@/features/products/api";
import ProductCard from "@/features/products/components/ProductCard";

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; categorySlug?: string; ageMonths?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const ageMonths = params.ageMonths ? Number(params.ageMonths) : undefined;

  const result = await getProducts({
    search: params.search,
    categorySlug: params.categorySlug,
    ageMonths,
  });

  let heading = "Tất cả sản phẩm";
  if (params.search) {
    heading = `Kết quả tìm kiếm cho "${params.search}"`;
  } else if (ageMonths !== undefined) {
    heading = `Sản phẩm phù hợp ${ageMonths} tháng tuổi`;
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] mb-2">
        {heading}
      </h1>
      <p className="text-sm text-[var(--brand-text-muted)] mb-8">
        {result.totalCount} sản phẩm
      </p>

      {result.items.length === 0 ? (
        <p className="text-[var(--brand-text-muted)]">
          Không tìm thấy sản phẩm nào phù hợp.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}