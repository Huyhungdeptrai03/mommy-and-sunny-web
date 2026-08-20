import Link from "next/link";
import { Gem, ShieldCheck, Truck, ArrowRight } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

export const metadata = {
  title: "Giới thiệu — Crab Be Bé",
  description:
    "Câu chuyện, sứ mệnh và cam kết của Crab Be Bé — mỹ phẩm và đồ sống nhập khẩu chính hãng từ Đức, Nhật Bản, Hàn Quốc.",
};

const VALUES = [
  {
    icon: Gem,
    title: "Giám tuyển thủ công",
    desc: "Mỗi sản phẩm được chọn lọc kỹ càng, không chạy theo số lượng — chỉ giữ lại những món chúng tôi thật sự tin dùng.",
  },
  {
    icon: ShieldCheck,
    title: "Chất lượng xác thực",
    desc: "Cam kết hàng chính hãng, có nguồn gốc rõ ràng, kiểm định trước khi lên kệ.",
  },
  {
    icon: Truck,
    title: "Giao hàng nhanh",
    desc: "Đóng gói cẩn thận, xử lý đơn nhanh chóng — miễn phí vận chuyển cho mọi đơn hàng.",
  },
];

export default function AboutPage() {
  return (
    <main>
      {/* ===== Hero ===== */}
      <section className="bg-[var(--brand-olive)] text-white">
        <div className="px-6 md:px-12 py-20 md:py-28 max-w-3xl">
          <span className="text-xs tracking-[0.3em] uppercase text-white/60">Giới thiệu</span>
          <h1 className="font-heading mt-5 text-4xl md:text-6xl font-extrabold uppercase leading-[1.05] tracking-tight">
            Câu chuyện
            <br />
            Crab Be Bé
          </h1>
          <p className="mt-6 text-white/70 leading-relaxed">
            Crab Be Bé ra đời từ mong muốn mang đến cho mẹ và bé những sản phẩm làm đẹp và đồ
            sống nhập khẩu chính hãng, được tuyển chọn kỹ càng thay vì chạy theo số lượng —
            nguồn gốc rõ ràng từ Đức, Nhật Bản và Hàn Quốc.
          </p>
        </div>
      </section>

      {/* ===== Sứ mệnh ===== */}
      <Reveal className="px-6 md:px-12 py-20">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <span className="text-xs tracking-[0.3em] uppercase text-[var(--brand-accent)]">
              Sứ mệnh
            </span>
            <h2 className="font-heading mt-2 text-2xl md:text-3xl font-bold uppercase tracking-tight text-[var(--brand-text)]">
              Ít hơn, nhưng tốt hơn
            </h2>
          </div>
          <div className="md:col-span-8 space-y-4 text-[15px] leading-relaxed text-[var(--brand-text-muted)]">
            <p>
              Thay vì bày bán tràn lan, Crab Be Bé chọn cách làm chậm hơn: mỗi sản phẩm trước
              khi lên kệ đều được đội ngũ trực tiếp tìm hiểu nguồn gốc, chất liệu và đánh giá
              thực tế trước khi giới thiệu tới khách hàng.
            </p>
            <p>
              Chúng tôi tin rằng mẹ và bé xứng đáng có những lựa chọn đáng tin cậy — không cần
              phải tự mình dò dẫm giữa hàng ngàn sản phẩm trôi nổi trên thị trường.
            </p>
          </div>
        </div>
      </Reveal>

      {/* ===== Giá trị cốt lõi ===== */}
      <section className="px-6 md:px-12 pb-20">
        <Reveal>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[var(--brand-border)] border-t border-b border-[var(--brand-border)]">
            {VALUES.map((value) => (
              <div key={value.title} className="flex flex-col items-start gap-3 p-8">
                <value.icon size={22} className="text-[var(--brand-text)]" />
                <h3 className="font-heading font-semibold uppercase tracking-wide text-sm text-[var(--brand-text)]">
                  {value.title}
                </h3>
                <p className="text-sm text-[var(--brand-text-muted)] leading-relaxed">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[var(--brand-cream-dark)]">
        <Reveal className="px-6 md:px-12 py-16 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-heading text-xl font-bold uppercase tracking-tight text-[var(--brand-text)]">
              Khám phá sản phẩm của chúng tôi
            </h2>
            <p className="text-sm text-[var(--brand-text-muted)] mt-2">
              Mỹ phẩm và đồ sống tuyển chọn — sẵn sàng đồng hành cùng mẹ và bé.
            </p>
          </div>
          <Link
            href="/products"
            className="group/cta relative inline-flex items-center gap-2 overflow-hidden bg-[var(--brand-olive)] px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors duration-300"
          >
            Xem sản phẩm <ArrowRight size={14} className="transition-transform duration-300 group-hover/cta:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
