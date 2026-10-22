import { Phone, Truck, Mail } from "lucide-react";

export default function TopBar() {
  return (
    <div className="hidden md:block bg-[var(--brand-olive)] text-white">
      <div className="px-6 md:px-12 py-2.5 flex items-center justify-between text-[11px] tracking-wide uppercase">
        <div className="flex items-center gap-6">
          <a href="tel:0898829311" className="flex items-center gap-1.5 hover:underline">
            <Phone size={12} /> Hotline: 0898829311
          </a>
          <span className="flex items-center gap-1.5">
            <Truck size={12} /> Miễn phí vận chuyển từ 500.000đ
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <Mail size={12} /> hello@crabbebe.vn
        </span>
      </div>
    </div>
  );
}
