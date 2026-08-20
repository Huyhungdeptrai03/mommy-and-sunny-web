import Link from "next/link";
import { MessageCircle, Camera, Phone, Mail, MapPin } from "lucide-react";
import { getCategoryTree } from "@/features/categories/api";

export default async function Footer() {
  const categories = await getCategoryTree().catch(() => []);

  return (
    <footer className="bg-white border-t border-[var(--brand-border)] mt-24">
      <div className="px-6 md:px-12 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        {/* Giới thiệu */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Crab Be Bé" className="h-28 w-28 rounded-full object-cover" />
          <p className="text-sm text-[var(--brand-text-muted)] mt-3 leading-relaxed">
            Imported Beauty &amp; Lifestyle — mỹ phẩm và đồ sống nhập khẩu chính hãng từ
            Đức, Nhật Bản, Hàn Quốc.
          </p>
          <div className="flex gap-2 mt-5">
            <a
              href="#"
              aria-label="Facebook"
              className="w-9 h-9 border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-text)] hover:border-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
            >
              <MessageCircle size={15} />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="w-9 h-9 border border-[var(--brand-border)] flex items-center justify-center text-[var(--brand-text)] hover:border-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
            >
              <Camera size={15} />
            </a>
          </div>
        </div>

        {/* Danh mục — dữ liệu thật từ API */}
        <div>
          <p className="font-heading text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-text)] mb-4">
            Danh mục
          </p>
          <ul className="space-y-2.5 text-sm">
            {categories.length === 0 ? (
              <li className="text-[var(--brand-text-muted)]">Đang cập nhật</li>
            ) : (
              categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/products?categorySlug=${cat.slug}`}
                    className="text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors"
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
          <p className="font-heading text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-text)] mb-4">
            Chính sách
          </p>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                href="/chinh-sach/doi-tra"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors"
              >
                Chính sách đổi trả
              </Link>
            </li>
            <li>
              <Link
                href="/chinh-sach/van-chuyen"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors"
              >
                Chính sách vận chuyển
              </Link>
            </li>
            <li>
              <Link
                href="/chinh-sach/bao-mat"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors"
              >
                Chính sách bảo mật
              </Link>
            </li>
            <li>
              <Link
                href="/chinh-sach/dieu-khoan"
                className="text-[var(--brand-text-muted)] hover:text-[var(--brand-text)] transition-colors"
              >
                Điều khoản dịch vụ
              </Link>
            </li>
          </ul>
        </div>

        {/* Liên hệ */}
        <div>
          <p className="font-heading text-xs font-semibold tracking-[0.15em] uppercase text-[var(--brand-text)] mb-4">
            Liên hệ
          </p>
          <ul className="space-y-3 text-sm text-[var(--brand-text-muted)]">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-[var(--brand-text)] shrink-0" />
              1900 xxxx (8:00 - 21:00)
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-[var(--brand-text)] shrink-0" />
              hello@crabbebe.vn
            </li>
            <li className="flex items-start gap-2">
              <MapPin size={14} className="text-[var(--brand-text)] shrink-0 mt-0.5" />
              Hà Nội, Việt Nam
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[var(--brand-border)]">
        <div className="px-6 md:px-12 py-5 text-center text-xs text-[var(--brand-text-muted)] tracking-wide">
          © {new Date().getFullYear()} CRAB BE BÉ. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
