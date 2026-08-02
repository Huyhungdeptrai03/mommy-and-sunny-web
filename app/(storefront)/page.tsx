import Link from "next/link";
import { Leaf, ShieldCheck, Truck, Star, Clock } from "lucide-react";
import { getProducts } from "@/features/products/api";
import { getCategoryTree } from "@/features/categories/api";
import { getFlashSaleProducts } from "@/features/products/api";
import ProductCard from "@/features/products/components/ProductCard";
import HeroSlider from "@/features/home/components/HeroSlider";
import CountdownTimer from "@/features/home/components/CountdownTimer";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_COLORS = [
  "var(--brand-pink)",
  "var(--brand-yellow)",
  "var(--brand-blue)",
  "var(--brand-green)",
];

const TRUST_BADGES = [
  {
    icon: Leaf,
    title: "100% Organic",
    desc: "Nguyên liệu tự nhiên, an toàn cho làn da nhạy cảm của bé",
  },
  {
    icon: ShieldCheck,
    title: "Bác sĩ nhi khuyên dùng",
    desc: "Mọi sản phẩm đều qua kiểm định chất lượng nghiêm ngặt",
  },
  {
    icon: Truck,
    title: "Giao hàng nhanh",
    desc: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ",
  },
];

// Mỗi mốc chọn 1 tháng tuổi đại diện nằm trong khoảng, khớp đúng logic lọc ở Backend
// (AgeRangeMinMonths <= ageMonths <= AgeRangeMaxMonths)
const AGE_RANGES = [
  { label: "Sơ sinh", subLabel: "0-6 tháng", months: 3 },
  { label: "Tập bò, tập đi", subLabel: "6-12 tháng", months: 9 },
  { label: "Chập chững", subLabel: "1-2 tuổi", months: 18 },
  { label: "Mẫu giáo", subLabel: "Trên 2 tuổi", months: 30 },
];

// Đánh giá minh họa — nhân vật hư cấu, chưa gắn với hệ thống review thật của Backend
const TESTIMONIALS = [
  {
    name: "Chị Lan Anh",
    role: "Mẹ bé Sunny, 8 tháng tuổi",
    quote:
      "Sản phẩm chất lượng, giao hàng nhanh, con mình dùng rất thích. Chắc chắn sẽ ủng hộ shop dài lâu.",
  },
  {
    name: "Chị Minh Thư",
    role: "Mẹ bé Tôm, 2 tuổi",
    quote:
      "Mình đặc biệt thích các sản phẩm Organic ở đây, an tâm cho làn da nhạy cảm của con.",
  },
  {
    name: "Chị Hải Yến",
    role: "Mẹ bé Bin, 14 tháng tuổi",
    quote:
      "Tư vấn nhiệt tình, đóng gói cẩn thận. Đặt hàng lần nào cũng ưng ý lần đó.",
  },
];

export default async function Home() {
  const [productResult, categories, flashSaleItems] = await Promise.all([
    getProducts(),
    getCategoryTree(),
    getFlashSaleProducts(),
  ]);

  return (
    <main>
      {/* ===== Hero Slider ===== */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <HeroSlider />
      </section>

      {/* ===== Flash Sale — chỉ hiện khi có ít nhất 1 biến thể đang giảm giá thật ===== */}
      {flashSaleItems.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mt-10">
          <div className="bg-[var(--brand-olive)] rounded-3xl p-6 md:p-8">
            <h2 className="font-heading text-xl font-extrabold text-white flex items-center gap-2 mb-6">
              ⚡ Flash Sale
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flashSaleItems.map((item) => (
                <Link
                  key={item.variantId}
                  href={`/products/${item.productSlug}`}
                  className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-[var(--brand-cream-dark)]">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)] text-xs">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="inline-block bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      -{item.discountPercent}%
                    </span>
                    <p className="text-sm font-medium text-[var(--brand-text)] mt-1.5 line-clamp-2">
                      {item.productName}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="font-bold text-[var(--brand-olive)]">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-xs text-[var(--brand-text-muted)] line-through">
                        {formatCurrency(item.compareAtPrice)}
                      </p>
                    </div>
                    <div className="mt-2 text-xs text-[var(--brand-text-muted)] flex items-center gap-1">
                      <Clock size={12} />
                      <CountdownTimer endsAt={item.saleEndsAt} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== Vì sao chọn Mommy & Sunny ===== */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="grid md:grid-cols-3 gap-6">
          {TRUST_BADGES.map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-white border border-[var(--brand-border)]"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--brand-green)] flex items-center justify-center">
                <badge.icon size={22} className="text-[var(--brand-olive-dark)]" />
              </div>
              <h3 className="font-heading font-semibold text-[var(--brand-text)]">
                {badge.title}
              </h3>
              <p className="text-sm text-[var(--brand-text-muted)]">{badge.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Mua theo độ tuổi bé — tận dụng đúng dữ liệu ageRangeMin/Max đã có ===== */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <h2 className="font-heading text-lg font-bold text-[var(--brand-text)] mb-1">
          Mua sắm theo độ tuổi bé
        </h2>
        <p className="text-sm text-[var(--brand-text-muted)] mb-6">
          Chọn đúng sản phẩm phù hợp từng giai đoạn phát triển của con
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AGE_RANGES.map((age) => (
            <Link
              key={age.months}
              href={`/products?ageMonths=${age.months}`}
              className="rounded-2xl bg-[var(--brand-blue)] hover:opacity-90 transition-opacity p-5 text-center"
            >
              <p className="font-heading font-semibold text-[var(--brand-text)]">{age.label}</p>
              <p className="text-xs text-[var(--brand-olive-dark)] mt-1">{age.subLabel}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== Danh mục nổi bật — thẻ lớn thay vì vòng tròn nhỏ ===== */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 mt-16">
          <h2 className="font-heading text-lg font-bold text-[var(--brand-text)] mb-6">
            Danh mục nổi bật
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, idx) => (
              <Link
                key={cat.id}
                href={`/products?categorySlug=${cat.slug}`}
                className="group rounded-2xl overflow-hidden border border-[var(--brand-border)] bg-white hover:shadow-md transition-shadow"
              >
                <div
                  className="h-24 flex items-center justify-center text-3xl overflow-hidden"
                  style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                >
                  {cat.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🌱"
                  )}
                </div>
                <div className="p-4">
                  <p className="font-heading font-semibold text-[var(--brand-text)]">
                    {cat.name}
                  </p>
                  <p className="text-xs text-[var(--brand-olive)] mt-1 group-hover:underline">
                    Xem sản phẩm →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Sản phẩm bán chạy ===== */}
      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold text-[var(--brand-olive)]">
              Sản phẩm bán chạy
            </h2>
            <p className="text-sm text-[var(--brand-text-muted)]">
              Những món đồ được nhiều mẹ tin dùng nhất
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-[var(--brand-olive)] hover:underline shrink-0"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
          {productResult.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ===== Mẹ nói gì về Mommy & Sunny ===== */}
      <section className="max-w-6xl mx-auto px-6 mt-16 mb-16">
        <h2 className="font-heading text-lg font-bold text-[var(--brand-text)] text-center mb-8">
          Mẹ nói gì về Mommy &amp; Sunny
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl bg-[var(--brand-cream-dark)] p-6"
            >
              <div className="flex gap-1 text-[var(--brand-olive)] mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm text-[var(--brand-text)] leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <p className="mt-4 font-heading font-semibold text-sm text-[var(--brand-text)]">
                {t.name}
              </p>
              <p className="text-xs text-[var(--brand-text-muted)]">{t.role}</p>
            </div>
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