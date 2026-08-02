import Link from "next/link";
import { MessageCircle, Camera, Phone, Mail, MapPin } from "lucide-react";
import { getCategoryTree } from "@/features/categories/api";

export default async function Footer() {
  const categories = await getCategoryTree().catch(() => []);

  return (
    <footer className="bg-white border-t border-[var(--brand-border)] mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Giới thiệu */}
        <div>
          <p className="font-heading text-lg font-extrabold text-[var(--brand-text)]">
            MOMMY &amp; SUNNY
          </p>
          <p className="text-sm text-[var(--brand-text-muted)] mt-3 leading-relaxed">
            Đồng hành cùng mẹ trong hành trình chăm sóc bé yêu — sản phẩm Organic an toàn,
            chất lượng cao.
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="#"
              aria-label="Facebook"
              className="w-9 h-9 rounded-full bg-[var(--brand-cream-dark)] flex items-center justify-center text-[var(--brand-olive)] hover:bg-[var(--brand-pink)] transition-colors"
            >
              <MessageCircle size={16} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full bg-[var(--brand-cream-dark)] flex items-center justify-center text-[var(--brand-olive)] hover:bg-[var(--brand-pink)] transition-colors"
            >
              <Camera size={16} />
            </a>
          </div>
        </div>

        {/* Danh mục — dữ liệu thật từ API */}
        <div>
          <p className="font-heading font-semibold text-[var(--brand-text)] mb-3">Danh mục</p>
          <ul className="space-y-2 text-sm">
            {categories.length === 0 ? (
              <li className="text-[var(--brand-text-muted)]">Đang cập nhật</li>
            ) : (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?categorySlug=${cat.slug}`}
                    className="text-[var(--brand-text-muted)] hover:text-[var(--brand-olive)] transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Chính sách */}
        <div>
          <p className="font-heading font-semibold text-[var(--brand-text)] mb-3">Chính sách</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/chinh-sach/doi-tra"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-olive)] transition-colors"
              >
                Chính sách đổi trả
              </Link>
            </li>
            <li>
              <Link
                href="/chinh-sach/van-chuyen"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-olive)] transition-colors"
              >
                Chính sách vận chuyển
              </Link>
            </li>
            <li>
              <Link
                href="/chinh-sach/bao-mat"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-olive)] transition-colors"
              >
                Chính sách bảo mật
              </Link>
            </li>
            <li>
              <Link
                href="/chinh-sach/dieu-khoan"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-olive)] transition-colors"
              >
                Điều khoản dịch vụ
              </Link>
            </li>
          </ul>
        </div>

        {/* Liên hệ */}
        <div>
          <p className="font-heading font-semibold text-[var(--brand-text)] mb-3">Liên hệ</p>
          <ul className="space-y-3 text-sm text-[var(--brand-text-muted)]">
            <li className="flex items-center gap-2">
              <Phone size={15} className="text-[var(--brand-olive)] shrink-0" />
              1900 xxxx (8:00 - 21:00)
            </li>
            <li className="flex items-center gap-2">
              <Mail size={15} className="text-[var(--brand-olive)] shrink-0" />
              hotro@mommyandsunny.vn
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={15} className="text-[var(--brand-olive)] shrink-0 mt-0.5" />
              Hà Nội, Việt Nam
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--brand-border)]">
        <div className="max-w-6xl mx-auto px-6 py-5 text-center text-xs text-[var(--brand-text-muted)]">
          © {new Date().getFullYear()} Mommy &amp; Sunny. All rights reserved.
        </div>
      </div>
    </footer>
  );
}