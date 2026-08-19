"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCategoryTree } from "@/features/categories/api";
import { Category } from "@/types/category";

export default function CategoryNavBar() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    void getCategoryTree()
      .then(setCategories)
      .catch(() => {
        // Lỗi tải danh mục không nên chặn cả trang — im lặng bỏ qua
      });
  }, []);

  // Chưa có danh mục nào (hoặc đang tải) -> không render gì, tránh 1 thanh trống
  if (categories.length === 0) return null;

  return (
    <nav className="hidden md:block bg-white border-b border-[var(--brand-border)]">
      <div className="px-6 md:px-12">
        <ul className="flex items-center gap-8 overflow-x-auto py-3.5 text-xs font-medium tracking-wide uppercase text-[var(--brand-text)] no-scrollbar">
          {categories.map((cat) => (
            <li key={cat.id} className="shrink-0">
              <Link
                href={`/products?categorySlug=${cat.slug}`}
                className="hover:text-[var(--brand-accent)] transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
