import Link from "next/link";
import { Gem, ShieldCheck, Truck, Star, Clock, ArrowRight, ArrowUpRight, Ship } from "lucide-react";
import { getProducts, getBrands } from "@/features/products/api";
import { getCategoryTree } from "@/features/categories/api";
import { getFlashSaleProducts } from "@/features/products/api";
import { getOpenPurchaseBatches } from "@/features/home/api";
import ProductCard from "@/features/products/components/ProductCard";
import CountdownTimer from "@/features/home/components/CountdownTimer";
import { formatCurrency } from "@/lib/utils";

// Bắt buộc render động mỗi lượt truy cập — trang chủ có Flash Sale/đếm ngược/tồn kho
// thay đổi liên tục, không được để Next.js "đóng băng" tĩnh lúc build (sẽ vừa lỗi build
// khi backend chưa sẵn sàng lúc build, vừa hiện dữ liệu cũ mãi mãi sau khi deploy)
export const dynamic = "force-dynamic";

const TRUST_BADGES = [
  {
    icon: Gem,
    title: "Giám tuyển thủ công",
    desc: "Mỗi sản phẩm được chọn lọc kỹ càng, không chạy theo số lượng",
  },
  {
    icon: ShieldCheck,
    title: "Chất lượng xác thực",
    desc: "Cam kết hàng chính hãng, kiểm định trước khi lên kệ",
  },
  {
    icon: Truck,
    title: "Giao hàng nhanh",
    desc: "Miễn phí vận chuyển cho đơn hàng từ 500.000đ",
  },
];

const TESTIMONIALS = [
  {
    name: "Chị Lan Anh",
    role: "Khách hàng thân thiết",
    quote:
      "Sản phẩm chất lượng, giao hàng nhanh. Chắc chắn sẽ ủng hộ shop dài lâu.",
  },
  {
    name: "Chị Minh Thư",
    role: "Khách hàng thân thiết",
    quote: "Mình thích cách shop chọn đồ — món nào cũng có gu, không đại trà.",
  },
  {
    name: "Chị Hải Yến",
    role: "Khách hàng thân thiết",
    quote: "Tư vấn nhiệt tình, đóng gói cẩn thận. Đặt hàng lần nào cũng ưng ý.",
  },
];

export default async function Home() {
  const [productResult, categories, flashSaleItems, openBatches, brands] = await Promise.all([
    getProducts(),
    getCategoryTree(),
    getFlashSaleProducts(),
    getOpenPurchaseBatches(),
    getBrands(),
  ]);

  const featuredCategories = categories.slice(0, 6);

  return (
    <main>
      {/* ===== Hero — full-bleed, mực đen, biên tập kiểu boutique cao cấp ===== */}
      <section className="bg-[var(--brand-olive)] text-white">
        <div className="px-6 md:px-12 py-20 md:py-28 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8">
            <span className="text-xs tracking-[0.3em] uppercase text-white/60">
              Crab Bébé — Imported Beauty &amp; Lifestyle
            </span>
            <h1 className="font-heading mt-5 text-4xl md:text-6xl font-extrabold uppercase leading-[1.05] tracking-tight">
              Nhập khẩu
              <br />
              chính hãng
            </h1>
          </div>
          <div className="md:col-span-4">
            <p className="text-white/70 leading-relaxed">
              Mỹ phẩm và đồ sống tuyển chọn trực tiếp từ Đức, Nhật Bản, Hàn Quốc — nguồn
              gốc rõ ràng, chất lượng xác thực.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 border border-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-white hover:text-[var(--brand-olive)] transition-colors"
            >
              Khám phá ngay <ArrowRight size={14} />
            </Link>
            <div className="flex items-center gap-3 mt-6 text-xs font-semibold tracking-[0.2em] text-white/50">
              <span>DE</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>JP</span>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>KR</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Danh mục — lưới ảnh biên tập, không icon màu mè ===== */}
      {featuredCategories.length > 0 && (
        <section className="px-6 md:px-12 pt-16">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-[var(--brand-text)]">
              Danh mục
            </h2>
            <Link
              href="/products"
              className="text-xs font-medium uppercase tracking-widest text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors flex items-center gap-1"
            >
              Xem tất cả <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--brand-border)] border border-[var(--brand-border)]">
            {featuredCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/products?categorySlug=${cat.slug}`}
                className="group relative aspect-[4/5] bg-[var(--brand-cream-dark)] overflow-hidden flex items-end"
              >
                {cat.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cat.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover grayscale-[15%] group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0" />
                <div className="relative p-5 flex items-center justify-between w-full">
                  <p className="font-heading text-white font-semibold uppercase tracking-wide text-sm">
                    {cat.name}
                  </p>
                  <ArrowRight
                    size={16}
                    className="text-white opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Flash Sale ===== */}
      {flashSaleItems.length > 0 && (
        <section className="px-6 md:px-12 mt-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs tracking-[0.3em] uppercase text-[var(--brand-accent)]">
                Có hạn
              </span>
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-[var(--brand-text)] mt-1">
                Flash Sale
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {flashSaleItems.map((item) => (
              <Link key={item.variantId} href={`/products/${item.productSlug}`} className="group block">
                <div className="aspect-square bg-[var(--brand-cream-dark)] overflow-hidden relative">
                  <span className="absolute top-0 left-0 z-10 bg-[var(--brand-olive)] text-white text-[10px] font-bold px-2.5 py-1.5 tracking-wide">
                    -{item.discountPercent}%
                  </span>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)] text-xs">
                      Chưa có ảnh
                    </div>
                  )}
                </div>
                <div className="pt-3">
                  <p className="text-sm font-medium text-[var(--brand-text)] line-clamp-2">
                    {item.productName}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <p className="font-bold text-[var(--brand-text)]">
                      {formatCurrency(item.price)}
                    </p>
                    <p className="text-xs text-[var(--brand-text-muted)] line-through">
                      {formatCurrency(item.compareAtPrice)}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-[var(--brand-text-muted)] flex items-center gap-1.5">
                    <Clock size={12} />
                    <CountdownTimer endsAt={item.saleEndsAt} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Đợt hàng đang mở ===== */}
      {openBatches.length > 0 && (
        <section className="px-6 md:px-12 mt-20">
          <div className="flex items-center gap-2 mb-1">
            <Ship size={18} className="text-[var(--brand-text)]" />
            <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)]">
              Đợt hàng đang mở — Đặt trước ngay
            </h2>
          </div>
          <p className="text-sm text-[var(--brand-text-muted)] mb-8">
            Hàng xách tay chính hãng, số lượng có hạn theo từng đợt
          </p>
          <div className="grid md:grid-cols-2 gap-px bg-[var(--brand-border)] border border-[var(--brand-border)]">
            {openBatches.map((batch) => (
              <Link
                key={batch.id}
                href={`/products?purchaseBatchId=${batch.id}`}
                className="bg-white p-6 flex items-center justify-between gap-4 hover:bg-[var(--brand-cream-dark)] transition-colors"
              >
                <div>
                  <p className="font-heading font-semibold text-[var(--brand-text)]">
                    {batch.name}
                  </p>
                  <p className="text-xs text-[var(--brand-text-muted)] mt-1">
                    {batch.countryOfOrigin && `${batch.countryOfOrigin} · `}
                    {batch.productCount} sản phẩm đang nhận đặt
                  </p>
                  <div className="mt-3 text-xs text-[var(--brand-text)] font-semibold flex items-center gap-1.5">
                    <Clock size={12} />
                    Chốt đơn sau <CountdownTimer endsAt={batch.closeDate} />
                  </div>
                </div>
                <ArrowRight size={18} className="text-[var(--brand-text)] shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Thương hiệu nổi bật ===== */}
      {brands.length > 0 && (
        <section className="px-6 md:px-12 mt-20">
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-8">
            Thương hiệu nổi bật
          </h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/products?search=${encodeURIComponent(brand)}`}
                className="border border-[var(--brand-border)] px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-[var(--brand-text)] hover:bg-[var(--brand-olive)] hover:border-[var(--brand-olive)] hover:text-white transition-colors"
              >
                {brand}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ===== Vì sao chọn Crab Bébé ===== */}
      <section className="px-6 md:px-12 mt-24">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--brand-border)] border-t border-b border-[var(--brand-border)]">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.title} className="flex flex-col items-start gap-3 p-8">
              <badge.icon size={22} className="text-[var(--brand-text)]" />
              <h3 className="font-heading font-semibold uppercase tracking-wide text-sm text-[var(--brand-text)]">
                {badge.title}
              </h3>
              <p className="text-sm text-[var(--brand-text-muted)] leading-relaxed">{badge.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Sản phẩm bán chạy ===== */}
      <section className="px-6 md:px-12 mt-24">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-[var(--brand-text)]">
              Sản phẩm bán chạy
            </h2>
            <p className="text-sm text-[var(--brand-text-muted)] mt-2">
              Những sản phẩm được nhiều khách hàng tin dùng nhất
            </p>
          </div>
          <Link
            href="/products"
            className="text-xs font-medium uppercase tracking-widest text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors flex items-center gap-1 shrink-0"
          >
            Xem tất cả <ArrowUpRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-8">
          {productResult.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ===== Khách hàng nói gì — Editorial: bất đối xứng, chữ lớn, kiểu tạp chí ===== */}
      <section className="px-6 md:px-12 mt-24 mb-20">
        <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-10">
          Khách hàng nói gì về Crab Bébé
        </h2>
        <div className="grid md:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-3">
            <span className="font-heading text-6xl text-[var(--brand-text)] leading-none block mb-2">
              &ldquo;
            </span>
            <p className="font-heading text-2xl md:text-3xl font-semibold text-[var(--brand-text)] leading-snug -mt-4">
              {TESTIMONIALS[0].quote}
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex gap-1 text-[var(--brand-accent)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm font-semibold text-[var(--brand-text)]">
                {TESTIMONIALS[0].name}
              </p>
              <span className="text-[var(--brand-text-muted)] text-sm">·</span>
              <p className="text-sm text-[var(--brand-text-muted)]">{TESTIMONIALS[0].role}</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            {TESTIMONIALS.slice(1).map((t) => (
              <div key={t.name} className="border-l-2 border-[var(--brand-border)] pl-4">
                <p className="text-sm text-[var(--brand-text)] leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <p className="mt-2 text-xs font-semibold text-[var(--brand-text)]">{t.name}</p>
                <p className="text-xs text-[var(--brand-text-muted)]">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Newsletter ===== */}
      <section className="bg-[var(--brand-olive)] text-white">
        <div className="px-6 md:px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight">
              Nhận ưu đãi độc quyền qua email
            </h2>
            <p className="text-sm text-white/60 mt-2 max-w-md">
              Đăng ký ngay để nhận thông tin khuyến mãi và sản phẩm mới sớm nhất.
            </p>
          </div>
          <form className="flex gap-0 w-full md:w-auto max-w-sm">
            <input
              type="email"
              placeholder="Email của bạn..."
              className="flex-1 px-4 py-3 border border-white/30 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white"
            />
            <button
              type="submit"
              className="bg-white text-[var(--brand-olive)] text-xs font-semibold uppercase tracking-widest px-6 py-3 hover:bg-white/90 transition-colors whitespace-nowrap"
            >
              Đăng ký
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
