import Link from "next/link";
import {
  Gem,
  ShieldCheck,
  Truck,
  Star,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Ship,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { getProducts, getBrands } from "@/features/products/api";
import { getCategoryTree } from "@/features/categories/api";
import { getFlashSaleProducts } from "@/features/products/api";
import { getOpenPurchaseBatches } from "@/features/home/api";
import ProductCard from "@/features/products/components/ProductCard";
import CountdownTimer from "@/features/home/components/CountdownTimer";
import Reveal from "@/components/ui/Reveal";
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

const TICKER_ITEMS = [
  "100% chính hãng",
  "Nhập khẩu Đức · Nhật · Hàn",
  "Freeship đơn từ 500.000đ",
  "Đổi trả trong 7 ngày",
  "Kiểm định trước khi lên kệ",
  "Hỗ trợ tư vấn 24/7",
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
      {/* ===== Hero — full-bleed, mực đen, biên tập kiểu boutique cao cấp, điểm thêm
          hoạ tiết trôi nhẹ + sticker để bớt "phẳng" mà vẫn giữ chất sang trọng ===== */}
      <section className="relative isolate overflow-hidden bg-[var(--brand-olive)] text-white animate-hero-in">
        <div aria-hidden className="absolute inset-0 bg-dot-grid text-white/[0.06]" />
        <div
          aria-hidden
          className="absolute -top-28 -right-20 h-80 w-80 rounded-full bg-[var(--brand-accent)]/30 blur-3xl animate-float-slow"
        />
        <div
          aria-hidden
          className="absolute -bottom-36 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl animate-float-slower"
        />

        <div className="relative px-6 md:px-12 py-20 md:py-28 grid md:grid-cols-12 gap-10 items-end">
          <div className="md:col-span-8">
            <span className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-white/60">
              <span className="h-px w-6 bg-white/40" />
              Crab Be Bé — Imported Beauty &amp; Lifestyle
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
              className="group/cta relative mt-6 inline-flex items-center gap-2 overflow-hidden border border-white px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-colors duration-300 hover:text-[var(--brand-olive)]"
            >
              <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-white transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/cta:scale-x-100" />
              Khám phá ngay
              <ArrowRight size={14} className="transition-transform duration-300 group-hover/cta:translate-x-1" />
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

        {/* Sticker trang trí — huy hiệu nổi, xoay nhẹ như tem đóng dấu */}
        <div className="pointer-events-none absolute right-8 top-8 hidden lg:flex -rotate-6 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-olive)] shadow-lg">
          <ShieldCheck size={13} /> Chính hãng 100%
        </div>

        {/* Gợi ý cuộn xuống — chi tiết nhỏ nhưng tạo cảm giác trang "sống" */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1.5 text-white/45 md:flex">
          <span className="text-[9px] uppercase tracking-[0.3em]">Cuộn xuống</span>
          <ChevronDown size={14} className="animate-bounce" />
        </div>
      </section>

      {/* ===== Dải cam kết chạy vô hạn — thêm chuyển động nhẹ ngay dưới Hero ===== */}
      <div className="group/marquee overflow-hidden border-b border-[var(--brand-border)] bg-[var(--brand-cream-dark)] py-3">
        <div className="marquee-track flex w-max gap-12">
          {[0, 1].map((dup) => (
            <div key={dup} aria-hidden={dup === 1} className="flex items-center gap-12">
              {TICKER_ITEMS.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-text-muted)]"
                >
                  <Sparkles size={12} className="text-[var(--brand-accent)]" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ===== Danh mục — lưới ảnh biên tập, không icon màu mè ===== */}
      {featuredCategories.length > 0 && (
        <section className="px-6 md:px-12 pt-16">
          <Reveal>
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
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--brand-border)] border border-[var(--brand-border)]">
            {featuredCategories.map((cat, i) => (
              <Reveal key={cat.id} delay={i * 70}>
                <Link
                  href={`/products?categorySlug=${cat.slug}`}
                  className="group relative flex aspect-[4/5] items-end overflow-hidden bg-[var(--brand-cream-dark)]"
                >
                  {cat.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.imageUrl}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover grayscale-[15%] transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 transition-opacity duration-300 group-hover:from-black/70" />
                  <div className="relative flex w-full items-center justify-between p-5">
                    <p className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
                      {cat.name}
                      <span className="mt-1 block h-px w-0 bg-white transition-all duration-300 group-hover:w-full" />
                    </p>
                    <ArrowRight
                      size={16}
                      className="text-white opacity-0 -translate-x-2 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ===== Flash Sale ===== */}
      {flashSaleItems.length > 0 && (
        <section className="px-6 md:px-12 mt-20">
          <Reveal>
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
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
            {flashSaleItems.map((item, i) => (
              <Reveal key={item.variantId} delay={Math.min(i * 60, 300)}>
                <Link href={`/products/${item.productSlug}`} className="group block">
                  <div className="aspect-square bg-[var(--brand-cream-dark)] overflow-hidden relative">
                    <span className="absolute top-0 left-0 z-10 animate-pulse-soft bg-[var(--brand-olive)] text-white text-[10px] font-bold px-2.5 py-1.5 tracking-wide">
                      -{item.discountPercent}%
                    </span>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--brand-text-muted)] text-xs">
                        Chưa có ảnh
                      </div>
                    )}
                  </div>
                  <div className="pt-3">
                    <p className="text-sm font-medium text-[var(--brand-text)] line-clamp-2 transition-colors duration-200 group-hover:text-[var(--brand-olive)]">
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
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ===== Đợt hàng đang mở ===== */}
      {openBatches.length > 0 && (
        <section className="px-6 md:px-12 mt-20">
          <Reveal>
            <div className="flex items-center gap-2 mb-1">
              <Ship size={18} className="text-[var(--brand-text)]" />
              <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)]">
                Đợt hàng đang mở — Đặt trước ngay
              </h2>
            </div>
            <p className="text-sm text-[var(--brand-text-muted)] mb-8">
              Hàng xách tay chính hãng, số lượng có hạn theo từng đợt
            </p>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-px bg-[var(--brand-border)] border border-[var(--brand-border)]">
            {openBatches.map((batch, i) => (
              <Reveal key={batch.id} delay={i * 80}>
                <Link
                  href={`/products?purchaseBatchId=${batch.id}`}
                  className="group flex items-center justify-between gap-4 border-l-2 border-transparent bg-white p-6 transition-colors hover:border-[var(--brand-olive)] hover:bg-[var(--brand-cream-dark)]"
                >
                  <div>
                    <p className="font-heading font-semibold text-[var(--brand-text)]">
                      {batch.name}
                    </p>
                    <p className="text-xs text-[var(--brand-text-muted)] mt-1">
                      {batch.countryOfOrigin && `${batch.countryOfOrigin} · `}
                      {batch.productCount} sản phẩm đang nhận đặt
                    </p>
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-text)]">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-olive)] opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-olive)]" />
                      </span>
                      Chốt đơn sau <CountdownTimer endsAt={batch.closeDate} />
                    </div>
                  </div>
                  <ArrowRight
                    size={18}
                    className="shrink-0 text-[var(--brand-text)] transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ===== Thương hiệu nổi bật ===== */}
      {brands.length > 0 && (
        <section className="px-6 md:px-12 mt-20">
          <Reveal>
            <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-8">
              Thương hiệu nổi bật
            </h2>
          </Reveal>
          <Reveal className="flex flex-wrap gap-2" delay={80}>
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/products?search=${encodeURIComponent(brand)}`}
                className="group/chip relative overflow-hidden border border-[var(--brand-border)] px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-[var(--brand-text)] transition-colors duration-300 hover:text-white"
              >
                <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-[var(--brand-olive)] transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/chip:scale-x-100" />
                {brand}
              </Link>
            ))}
          </Reveal>
        </section>
      )}

      {/* ===== Vì sao chọn Crab Be Bé ===== */}
      <Reveal className="px-6 md:px-12 mt-24">
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--brand-border)] border-t border-b border-[var(--brand-border)]">
          {TRUST_BADGES.map((badge, i) => (
            <div key={badge.title} className="group relative flex flex-col items-start gap-3 overflow-hidden p-8">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-3 right-3 font-heading text-7xl font-extrabold text-[var(--brand-border)] transition-colors duration-300 group-hover:text-[var(--brand-pink)]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <badge.icon
                size={22}
                className="relative text-[var(--brand-text)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
              />
              <h3 className="relative font-heading font-semibold uppercase tracking-wide text-sm text-[var(--brand-text)]">
                {badge.title}
              </h3>
              <p className="relative text-sm text-[var(--brand-text-muted)] leading-relaxed">{badge.desc}</p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ===== Sản phẩm bán chạy ===== */}
      <section className="px-6 md:px-12 mt-24">
        <Reveal>
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
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 mt-8">
          {productResult.items.map((product, i) => (
            <Reveal key={product.id} delay={Math.min(i * 50, 300)}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Khách hàng nói gì — Editorial: bất đối xứng, chữ lớn, kiểu tạp chí ===== */}
      <section className="px-6 md:px-12 mt-24 mb-20">
        <Reveal>
          <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-10">
            Khách hàng nói gì về Crab Be Bé
          </h2>
        </Reveal>
        <div className="grid md:grid-cols-5 gap-8 items-start">
          <Reveal className="md:col-span-3">
            <span className="font-heading text-6xl text-[var(--brand-text)] leading-none block mb-2 transition-transform duration-300 hover:-rotate-3">
              &ldquo;
            </span>
            <p className="font-heading text-2xl md:text-3xl font-semibold text-[var(--brand-text)] leading-snug -mt-4">
              {TESTIMONIALS[0].quote}
            </p>
            <div className="flex items-center gap-3 mt-6">
              <div className="flex gap-1 text-[var(--brand-accent)]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill="currentColor"
                    className="transition-transform duration-200 hover:scale-125"
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-[var(--brand-text)]">
                {TESTIMONIALS[0].name}
              </p>
              <span className="text-[var(--brand-text-muted)] text-sm">·</span>
              <p className="text-sm text-[var(--brand-text-muted)]">{TESTIMONIALS[0].role}</p>
            </div>
          </Reveal>

          <div className="md:col-span-2 space-y-6">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <Reveal key={t.name} delay={(i + 1) * 90}>
                <div className="border-l-2 border-[var(--brand-border)] pl-4 transition-colors duration-300 hover:border-[var(--brand-olive)]">
                  <p className="text-sm text-[var(--brand-text)] leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[var(--brand-text)]">{t.name}</p>
                  <p className="text-xs text-[var(--brand-text-muted)]">{t.role}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Newsletter ===== */}
      <section className="relative isolate overflow-hidden bg-[var(--brand-olive)] text-white">
        <div aria-hidden className="absolute inset-0 bg-dot-grid text-white/[0.06]" />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-float-slow"
        />
        <Reveal className="relative px-6 md:px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
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
              className="flex-1 px-4 py-3 border border-white/30 bg-transparent text-sm text-white placeholder:text-white/50 outline-none transition-shadow focus:border-white focus:shadow-[0_0_0_3px_rgba(255,255,255,0.15)]"
            />
            <button
              type="submit"
              className="group/sub relative overflow-hidden bg-white text-[var(--brand-olive)] text-xs font-semibold uppercase tracking-widest px-6 py-3 whitespace-nowrap transition-transform duration-300 hover:-translate-y-0.5"
            >
              Đăng ký
            </button>
          </form>
        </Reveal>
      </section>
    </main>
  );
}
