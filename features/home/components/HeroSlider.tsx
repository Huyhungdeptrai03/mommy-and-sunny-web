"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Baby, Heart, Star, Gift, Sparkles, Puzzle } from "lucide-react";

interface SlideIcon {
  Icon: LucideIcon;
  rotate: string;
  offset?: string;
}

interface Slide {
  badge: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  bgColor: string;
  icons: SlideIcon[];
}

const SLIDES: Slide[] = [
  {
    badge: "Ưu đãi mùa xuân",
    title: "Giảm tới 30% Bộ sưu tập Xuân",
    subtitle:
      "Chăm sóc bé yêu với những chất liệu Organic cao cấp, nhẹ nhàng như vòng tay mẹ.",
    ctaLabel: "Mua ngay",
    ctaHref: "/products",
    bgColor: "var(--brand-pink)",
    icons: [
      { Icon: Baby, rotate: "-rotate-6" },
      { Icon: Heart, rotate: "rotate-6", offset: "mt-8" },
      { Icon: Gift, rotate: "-rotate-4" },
      { Icon: Star, rotate: "rotate-4", offset: "mt-4" },
    ],
  },
  {
    badge: "Phát triển trí tuệ",
    title: "Đồ chơi khơi nguồn sáng tạo",
    subtitle:
      "Bộ sưu tập đồ chơi an toàn, kích thích tư duy và vận động cho bé mỗi ngày.",
    ctaLabel: "Khám phá",
    ctaHref: "/products?categorySlug=do-choi",
    bgColor: "var(--brand-blue)",
    icons: [
      { Icon: Puzzle, rotate: "rotate-6" },
      { Icon: Sparkles, rotate: "-rotate-6", offset: "mt-8" },
      { Icon: Star, rotate: "rotate-4" },
      { Icon: Gift, rotate: "-rotate-4", offset: "mt-4" },
    ],
  },
  {
    badge: "Chăm sóc toàn diện",
    title: "Đồng hành cùng mẹ & bé",
    subtitle:
      "Từ sơ sinh đến mẫu giáo — mọi sản phẩm mẹ cần đều có tại Mommy & Sunny.",
    ctaLabel: "Khám phá",
    ctaHref: "/products",
    bgColor: "var(--brand-green)",
    icons: [
      { Icon: Heart, rotate: "-rotate-4" },
      { Icon: Baby, rotate: "rotate-6", offset: "mt-8" },
      { Icon: Sparkles, rotate: "-rotate-6" },
      { Icon: Star, rotate: "rotate-4", offset: "mt-4" },
    ],
  },
];

const AUTO_PLAY_MS = 5000;

export default function HeroSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SLIDES.length);
    }, AUTO_PLAY_MS);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div
      className="relative rounded-3xl overflow-hidden min-h-[360px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {SLIDES.map((slide, index) => (
        <div
          key={slide.title}
          className={`absolute inset-0 flex items-center transition-opacity duration-700 ease-in-out ${
            index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
          style={{ backgroundColor: slide.bgColor }}
        >
          <div className="relative z-10 p-10 max-w-md">
            <span className="inline-block bg-white/70 text-[var(--brand-olive)] text-xs font-semibold px-3 py-1 rounded-full mb-4">
              {slide.badge}
            </span>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-[var(--brand-text)] leading-tight">
              {slide.title}
            </h1>
            <p className="mt-3 text-[var(--brand-text-muted)]">{slide.subtitle}</p>
            <Link
              href={slide.ctaHref}
              className="inline-block mt-6 bg-[var(--brand-olive)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              {slide.ctaLabel}
            </Link>
          </div>

          <div className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2">
            <div className="grid grid-cols-2 gap-6">
              {slide.icons.map(({ Icon, rotate, offset }, i) => (
                <div
                  key={i}
                  className={`w-20 h-20 rounded-3xl bg-white/60 flex items-center justify-center ${rotate} ${
                    offset ?? ""
                  }`}
                >
                  <Icon size={30} className="text-[var(--brand-olive)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Chấm điều hướng — bấm để nhảy thẳng đến slide, đồng thời hiển thị slide đang active */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            aria-label={`Chuyển đến slide ${index + 1}`}
            onClick={() => setActiveIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === activeIndex ? "w-6 bg-[var(--brand-olive)]" : "w-2 bg-white/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}