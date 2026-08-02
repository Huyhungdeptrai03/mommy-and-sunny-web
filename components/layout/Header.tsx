"use client";

import Link from "next/link";
import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, ChevronDown, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getCategoryTree } from "@/features/categories/api";
import { Category } from "@/types/category";

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((state) => state.itemCount);

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // State riêng cho menu mobile — tách biệt hoàn toàn với dropdown desktop (dùng hover)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileCategoriesOpen, setIsMobileCategoriesOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    void getCategoryTree()
      .then(setCategories)
      .catch(() => {
        // Lỗi tải danh mục không nên chặn cả trang — im lặng bỏ qua
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Header là component nằm trong layout gốc — KHÔNG bị unmount khi chuyển trang,
  // nên phải tự đóng menu mobile mỗi lần bấm link, nếu không menu sẽ vẫn mở khi sang trang mới
  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
    setIsMobileCategoriesOpen(false);
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      closeMobileMenu();
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const displayName = user?.fullName?.trim().split(" ").pop() ?? "";

  return (
    <header className="bg-[var(--brand-cream)] border-b border-[var(--brand-border)] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4 md:gap-6">
        {/* Hamburger — chỉ hiện trên mobile */}
        <button
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          aria-label="Menu"
          className="md:hidden text-[var(--brand-text)]"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link
          href="/"
          onClick={closeMobileMenu}
          className="font-heading text-lg font-extrabold tracking-wide text-[var(--brand-text)] shrink-0"
        >
          MOMMY &amp; SUNNY
        </Link>

        {/* Menu desktop — dropdown dùng hover, chỉ phù hợp chuột */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[var(--brand-text)] shrink-0">
          <Link href="/" className="hover:text-[var(--brand-olive)] transition-colors">
            Trang chủ
          </Link>

          <div className="relative group">
            <button className="flex items-center gap-1 hover:text-[var(--brand-olive)] transition-colors">
              Sản phẩm <ChevronDown size={14} />
            </button>
            <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
              <div className="bg-white border border-[var(--brand-border)] rounded-2xl shadow-lg p-2 min-w-[190px]">
                <Link
                  href="/products"
                  className="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--brand-cream-dark)]"
                >
                  Tất cả sản phẩm
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?categorySlug=${cat.slug}`}
                    className="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--brand-cream-dark)]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm sản phẩm cho bé..."
              className="w-full border border-[var(--brand-border)] rounded-full pl-5 pr-11 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)] transition-colors"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[var(--brand-olive)] text-white flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <Search size={15} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-5 shrink-0">
          <Link
            href="/cart"
            onClick={closeMobileMenu}
            aria-label="Giỏ hàng"
            className="relative text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
          >
            <ShoppingCart size={20} />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[var(--brand-olive)] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>

          {!mounted ? (
            <div className="w-5 h-5" />
          ) : isAuthenticated ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
              >
                <User size={20} />
                <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-[var(--brand-border)] rounded-2xl shadow-lg p-3 min-w-[190px] text-sm">
                  <p className="px-3 py-1 text-[var(--brand-text-muted)] truncate">
                    Xin chào, {user?.fullName}
                  </p>
                  <Link
                    href="/orders"
                    onClick={() => {
                      setUserMenuOpen(false);
                      closeMobileMenu();
                    }}
                    className="block px-3 py-2 rounded-lg hover:bg-[var(--brand-cream-dark)] text-[var(--brand-text)]"
                  >
                    Đơn hàng
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative group">
              <Link
                href="/login"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
              >
                <User size={20} />
                <span className="hidden sm:inline text-sm font-medium">Đăng nhập</span>
              </Link>

              <div className="absolute right-0 top-full mt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                <div className="relative bg-[var(--brand-olive)] text-white text-xs font-medium rounded-xl px-4 py-2.5 whitespace-nowrap shadow-lg">
                  🎁 Đăng nhập để nhận ưu đãi độc quyền!
                  <div className="absolute -top-1 right-5 w-2.5 h-2.5 bg-[var(--brand-olive)] rotate-45" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Menu mobile — dạng accordion, thay thế cho dropdown hover không phù hợp cảm ứng ===== */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--brand-border)] bg-white">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col text-sm font-medium text-[var(--brand-text)]">
            <Link href="/" onClick={closeMobileMenu} className="py-2.5">
              Trang chủ
            </Link>

            <button
              onClick={() => setIsMobileCategoriesOpen((v) => !v)}
              className="flex items-center justify-between py-2.5"
              aria-expanded={isMobileCategoriesOpen}
            >
              Sản phẩm
              <ChevronDown
                size={16}
                className={`transition-transform ${isMobileCategoriesOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isMobileCategoriesOpen && (
              <div className="pl-4 flex flex-col border-l border-[var(--brand-border)] ml-1 mb-2">
                <Link
                  href="/products"
                  onClick={closeMobileMenu}
                  className="py-2 text-[var(--brand-text-muted)]"
                >
                  Tất cả sản phẩm
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/products?categorySlug=${cat.slug}`}
                    onClick={closeMobileMenu}
                    className="py-2 text-[var(--brand-text-muted)]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}