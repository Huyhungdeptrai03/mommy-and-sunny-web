import { getProducts } from "@/features/products/api";
import { getCategoryTree } from "@/features/categories/api";
import ProductCard from "@/features/products/components/ProductCard";

const CATEGORY_COLORS = [
  "var(--brand-pink)",
  "var(--brand-yellow)",
  "var(--brand-blue)",
  "var(--brand-green)",
];

export default async function Home() {
  const [productResult, categories] = await Promise.all([getProducts(), getCategoryTree()]);

  return (
    <main>
      {/* ===== Hero ===== */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <div className="relative rounded-3xl overflow-hidden bg-[var(--brand-pink)] min-h-[320px] flex items-center">
          <div className="relative z-10 p-10 max-w-md">
            <span className="inline-block bg-white/70 text-[var(--brand-olive)] text-xs font-semibold px-3 py-1 rounded-full mb-4">
              Ưu đãi mùa xuân
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-[var(--brand-text)] leading-tight">
              Giảm tới 30%
              <br /> Bộ sưu tập Xuân
            </h1>
            <p className="mt-3 text-[var(--brand-text-muted)]">
              Chăm sóc bé yêu với những chất liệu Organic cao cấp, nhẹ nhàng như vòng tay mẹ.
            </p>
            <a
              href="#san-pham-ban-chay"
              className="inline-block mt-6 bg-[var(--brand-olive)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Mua ngay
            </a>
          </div>
        </div>
      </section>

      {/* ===== Danh mục nổi bật ===== */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mt-14">
          <h2 className="font-heading text-center text-lg font-bold text-[var(--brand-text)]">
            Danh mục nổi bật
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-8">
            {categories.map((cat, idx) => (
              <div key={cat.id} className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                >
                  🌱
                </div>
                <span className="text-sm font-medium text-[var(--brand-text)]">{cat.name}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===== Sản phẩm bán chạy ===== */}
      <section id="san-pham-ban-chay" className="max-w-6xl mx-auto px-6 mt-16">
        <div>
          <h2 className="font-heading text-lg font-bold text-[var(--brand-olive)]">
            Sản phẩm bán chạy
          </h2>
          <p className="text-sm text-[var(--brand-text-muted)]">
            Những món đồ được nhiều mẹ tin dùng nhất
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pb-16">
          {productResult.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ===== Newsletter ===== */}
      <section className="bg-[var(--brand-green)]">
        <div className="max-w-6xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-heading text-xl font-bold text-[var(--brand-text)]">
              Nhận bí quyết chăm sóc bé &amp; Ưu đãi độc quyền
            </h2>
            <p className="text-sm text-[var(--brand-text-muted)] mt-2 max-w-md">
              Đăng ký ngay để nhận mẹo chăm sóc con và ưu đãi giảm giá hàng đầu.
            </p>
            <form className="mt-4 flex gap-2 max-w-sm">
              <input
                type="email"
                placeholder="Email của mẹ..."
                className="flex-1 rounded-full px-4 py-2 border border-[var(--brand-border)] bg-white text-sm"
              />
              <button
                type="submit"
                className="bg-[var(--brand-olive)] text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Đăng ký
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}