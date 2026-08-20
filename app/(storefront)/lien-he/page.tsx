import { Phone, Mail, MapPin, Clock, MessageCircle, Camera } from "lucide-react";

export const metadata = {
  title: "Liên hệ — Crab Bébé",
  description: "Thông tin liên hệ Crab Bébé — hotline, email và địa chỉ.",
};

const CONTACT_METHODS = [
  {
    icon: Phone,
    label: "Hotline",
    value: "1900 xxxx",
    href: "tel:1900xxxx",
    note: "8:00 - 21:00, tất cả các ngày trong tuần",
  },
  {
    icon: Mail,
    label: "Email",
    value: "hello@crabbebe.vn",
    href: "mailto:hello@crabbebe.vn",
    note: "Phản hồi trong vòng 24 giờ làm việc",
  },
  {
    icon: MapPin,
    label: "Địa chỉ",
    value: "Hà Nội, Việt Nam",
    href: null,
    note: "Giao hàng toàn quốc",
  },
];

export default function ContactPage() {
  return (
    <main>
      <section className="bg-[var(--brand-olive)] text-white">
        <div className="px-6 md:px-12 py-20 md:py-28 max-w-2xl">
          <span className="text-xs tracking-[0.3em] uppercase text-white/60">Liên hệ</span>
          <h1 className="font-heading mt-5 text-4xl md:text-6xl font-extrabold uppercase leading-[1.05] tracking-tight">
            Chúng tôi
            <br />
            luôn lắng nghe
          </h1>
          <p className="mt-6 text-white/70 leading-relaxed">
            Có câu hỏi về sản phẩm, đơn hàng hay chỉ đơn giản muốn trò chuyện? Đội ngũ Crab
            Bébé sẵn sàng hỗ trợ bạn qua các kênh dưới đây.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-12 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--brand-border)] border border-[var(--brand-border)]">
          {CONTACT_METHODS.map((method) => {
            const content = (
              <div className="bg-white p-8 h-full flex flex-col gap-3">
                <method.icon size={22} className="text-[var(--brand-olive)]" />
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--brand-text-muted)]">
                    {method.label}
                  </p>
                  <p className="font-heading font-semibold text-lg text-[var(--brand-text)] mt-1">
                    {method.value}
                  </p>
                </div>
                <p className="text-sm text-[var(--brand-text-muted)] mt-auto">{method.note}</p>
              </div>
            );

            return method.href ? (
              <a key={method.label} href={method.href} className="block hover:bg-[var(--brand-cream-dark)] transition-colors">
                {content}
              </a>
            ) : (
              <div key={method.label}>{content}</div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-t border-[var(--brand-border)] pt-10">
          <div className="flex items-center gap-3 text-sm text-[var(--brand-text-muted)]">
            <Clock size={16} className="text-[var(--brand-text)]" />
            Thời gian làm việc: 8:00 - 21:00, tất cả các ngày trong tuần
          </div>
          <div className="flex gap-2">
            <a
              href="#"
              aria-label="Facebook"
              className="w-10 h-10 border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-text)] hover:border-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
            >
              <MessageCircle size={16} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="w-10 h-10 border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-text)] hover:border-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
            >
              <Camera size={16} />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
