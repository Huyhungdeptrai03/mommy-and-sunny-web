import { Phone, Truck, Mail } from "lucide-react";

export default function TopBar() {
  return (
    <div className="hidden md:block bg-[var(--brand-olive)] text-white">
      <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <Phone size={13} /> Hotline: 1900 xxxx
          </span>
          <span className="flex items-center gap-1.5">
            <Truck size={13} /> Miễn phí vận chuyển cho đơn từ 500.000đ
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <Mail size={13} /> hotro@mommyandsunny.vn
        </span>
      </div>
    </div>
  );
}