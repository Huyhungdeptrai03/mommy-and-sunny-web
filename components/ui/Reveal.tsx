"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

// Bọc quanh 1 section/thẻ để nó mờ + trượt nhẹ lên khi cuộn tới lần đầu —
// dùng IntersectionObserver thay vì animation library ngoài. delay (ms) dùng
// để so le nhiều thẻ liền kề (ví dụ danh mục, sản phẩm) cho sống động hơn.
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
