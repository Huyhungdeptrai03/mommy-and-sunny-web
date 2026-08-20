import { Phone } from "lucide-react";

// Số/link mặc định khớp placeholder đang dùng ở TopBar — thay bằng số thật qua
// biến môi trường NEXT_PUBLIC_HOTLINE / NEXT_PUBLIC_ZALO_LINK trong .env.local
const HOTLINE = process.env.NEXT_PUBLIC_HOTLINE ?? "1900xxxx";
const ZALO_LINK = process.env.NEXT_PUBLIC_ZALO_LINK ?? `https://zalo.me/${HOTLINE}`;

function ZaloIcon() {
  return (
    <svg viewBox="0 0 48 48" width={26} height={26} aria-hidden="true">
      <path
        fill="#0068FF"
        d="M24 4C12.95 4 4 12.06 4 22c0 5.6 2.86 10.6 7.34 13.9-.24 1.9-.9 4.24-2.2 6.5a.6.6 0 0 0 .74.86c3.1-1.14 5.7-2.7 7.36-3.86A22.6 22.6 0 0 0 24 40c11.05 0 20-8.06 20-18S35.05 4 24 4Z"
      />
      <text x="24" y="25" textAnchor="middle" fontSize="12" fontWeight="700" fill="#ffffff" fontFamily="sans-serif">
        Zalo
      </text>
    </svg>
  );
}

export default function StickyContactButtons() {
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
      <a
        href={ZALO_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat qua Zalo"
        className="w-12 h-12 rounded-full bg-white border border-[var(--brand-border)] shadow-lg flex items-center justify-center text-[var(--brand-text)] hover:scale-105 transition-transform"
      >
        <ZaloIcon />
      </a>
      <a
        href={`tel:${HOTLINE.replace(/\s+/g, "")}`}
        aria-label={`Gọi hotline ${HOTLINE}`}
        className="w-12 h-12 rounded-full bg-[var(--brand-accent)] shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform animate-pulse"
      >
        <Phone size={20} />
      </a>
    </div>
  );
}
