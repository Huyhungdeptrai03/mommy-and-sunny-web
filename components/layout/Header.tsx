"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((state) => state.itemCount);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-[var(--brand-cream)] border-b border-[var(--brand-border)] sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="font-heading text-lg font-extrabold tracking-wide text-[var(--brand-text)]"
        >
          MOMMY &amp; SUNNY
        </Link>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/cart"
            className="relative text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
          >
            Giỏ hàng
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-[var(--brand-olive)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {!mounted ? null : isAuthenticated ? (
            <>
              <Link
                href="/orders"
                className="text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
              >
                Đơn hàng
              </Link>
              <span className="text-[var(--brand-text-muted)] hidden sm:inline">
                Xin chào, {user?.fullName}
              </span>
              <button
                onClick={logout}
                className="text-[var(--brand-olive)] hover:underline"
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="bg-[var(--brand-olive)] text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
              >
                Đăng ký
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}