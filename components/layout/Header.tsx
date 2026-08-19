"use client";

import Link from "next/link";
import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, Heart, User, ChevronDown, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { getMyWishlist } from "@/features/wishlist/api";
import { getCategoryTree } from "@/features/categories/api";
import { getProducts } from "@/features/products/api";
import { formatCurrency } from "@/lib/utils";
import { Category } from "@/types/category";
import { ProductListItem } from "@/types/product";

const SUGGESTION_MIN_CHARS = 2;
const SUGGESTION_DEBOUNCE_MS = 300;

export default function Header() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const itemCount = useCartStore((state) => state.itemCount);
  const wishlistCount = useWishlistStore((state) => state.productIds.size);
  const setWishlistIds = useWishlistStore((state) => state.setProductIds);

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Gợi ý tìm kiếm trực tiếp khi gõ — VD gõ "nước hoa" ra ngay các sản phẩm thuộc
  // danh mục Nước hoa, không cần bấm Enter mới thấy có gì liên quan hay không
  const [suggestions, setSuggestions] = useState<ProductListItem[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const searchBoxRef = useRef<HTMLFormElement>(null);

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

  // Tải danh sách ID yêu thích ngay khi đăng nhập — để mọi ProductCard trên trang
  // biết ngay sản phẩm nào đã yêu thích mà không cần gọi API riêng cho từng thẻ
  useEffect(() => {
    if (!isAuthenticated) {
      setWishlistIds([]);
      return;
    }
    void getMyWishlist()
      .then((items) => setWishlistIds(items.map((i) => i.productId)))
      .catch(() => {
        // Lỗi tải wishlist không nên chặn cả trang — im lặng bỏ qua
      });
  }, [isAuthenticated, setWishlistIds]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce — chỉ gọi API sau khi khách ngừng gõ ~300ms, tránh spam request mỗi phím bấm
  useEffect(() => {
    const term = searchQuery.trim();
    if (term.length < SUGGESTION_MIN_CHARS) {
      setSuggestions([]);
      setIsSuggestLoading(false);
      return;
    }

    let cancelled = false;
    setIsSuggestLoading(true);
    const timer = setTimeout(() => {
      void getProducts({ search: term, pageSize: 5 })
        .then((result) => {
          if (cancelled) return;
          setSuggestions(result.items);
          setIsSuggestOpen(true);
        })
        .catch(() => {
          // Lỗi gợi ý không nên chặn thao tác tìm kiếm chính — im lặng bỏ qua
        })
        .finally(() => {
          if (!cancelled) setIsSuggestLoading(false);
        });
    }, SUGGESTION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

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
      setIsSuggestOpen(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function handleSuggestionClick() {
    closeMobileMenu();
    setIsSuggestOpen(false);
  }

  const displayName = user?.fullName?.trim().split(" ").pop() ?? "";

  return (
    <header className="bg-white border-b border-[var(--brand-border)] sticky top-0 z-20">
      <div className="px-6 md:px-12 py-5 flex items-center gap-4 md:gap-8">
        {/* Hamburger — chỉ hiện trên mobile */}
        <button
          onClick={() => setIsMobileMenuOpen((v) => !v)}
          aria-label="Menu"
          className="md:hidden text-[var(--brand-text)]"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" onClick={closeMobileMenu} className="shrink-0 flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Crab Bébé" className="h-16 w-16 rounded-full object-cover" />
        </Link>

        {/* Menu desktop — giờ chỉ còn "Trang chủ", danh mục chuyển sang CategoryNavBar riêng */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium tracking-wide uppercase text-[var(--brand-text)] shrink-0">
          <Link href="/" className="hover:text-[var(--brand-accent)] transition-colors">
            Trang chủ
          </Link>
        </nav>

        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md" ref={searchBoxRef}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setIsSuggestOpen(true)}
              placeholder="Tìm sản phẩm — VD: nước hoa..."
              autoComplete="off"
              className="w-full border border-[var(--brand-border)] pl-4 pr-11 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--brand-text)] transition-colors"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
            >
              <Search size={16} />
            </button>

            {/* ===== Gợi ý tìm kiếm trực tiếp ===== */}
            {isSuggestOpen && searchQuery.trim().length >= SUGGESTION_MIN_CHARS && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-[var(--brand-border)] shadow-lg z-30 max-h-[70vh] overflow-y-auto">
                {isSuggestLoading ? (
                  <p className="p-4 text-sm text-[var(--brand-text-muted)]">Đang tìm...</p>
                ) : suggestions.length === 0 ? (
                  <p className="p-4 text-sm text-[var(--brand-text-muted)]">
                    Không tìm thấy sản phẩm nào khớp &quot;{searchQuery.trim()}&quot;
                  </p>
                ) : (
                  <>
                    <ul>
                      {suggestions.map((product) => (
                        <li key={product.id}>
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={handleSuggestionClick}
                            className="flex items-center gap-3 p-3 hover:bg-[var(--brand-cream-dark)] transition-colors"
                          >
                            <div className="w-11 h-11 shrink-0 bg-[var(--brand-cream-dark)] overflow-hidden">
                              {product.primaryImageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.primaryImageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-[var(--brand-text)] truncate">
                                {product.name}
                              </p>
                              <p className="text-xs font-semibold text-[var(--brand-text)] mt-0.5">
                                {formatCurrency(product.minPrice)}
                              </p>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="submit"
                      className="w-full text-center p-3 text-xs font-semibold uppercase tracking-widest text-[var(--brand-text)] hover:bg-[var(--brand-cream-dark)] border-t border-[var(--brand-border)] transition-colors"
                    >
                      Xem tất cả kết quả cho &quot;{searchQuery.trim()}&quot;
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center gap-5 shrink-0">
          <Link
            href="/wishlist"
            onClick={closeMobileMenu}
            aria-label="Yêu thích"
            className="relative text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
          >
            <Heart size={19} />
            {mounted && wishlistCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[var(--brand-text)] text-white text-[9px] w-4 h-4 flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            onClick={closeMobileMenu}
            aria-label="Giỏ hàng"
            className="relative text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
          >
            <ShoppingCart size={19} />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-[var(--brand-text)] text-white text-[9px] w-4 h-4 flex items-center justify-center">
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
                className="flex items-center gap-2 text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
              >
                <User size={19} />
                <span className="hidden sm:inline text-xs font-medium uppercase tracking-wide">
                  {displayName}
                </span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-3 bg-white border border-[var(--brand-border)] shadow-lg p-2 min-w-[190px] text-sm">
                  <p className="px-3 py-1.5 text-[var(--brand-text-muted)] truncate text-xs">
                    Xin chào, {user?.fullName}
                  </p>
                  <Link
                    href="/orders"
                    onClick={() => {
                      setUserMenuOpen(false);
                      closeMobileMenu();
                    }}
                    className="block px-3 py-2 hover:bg-[var(--brand-cream-dark)] text-[var(--brand-text)]"
                  >
                    Đơn hàng
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => {
                      setUserMenuOpen(false);
                      closeMobileMenu();
                    }}
                    className="block px-3 py-2 hover:bg-[var(--brand-cream-dark)] text-[var(--brand-text)]"
                  >
                    Yêu thích
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600"
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
                className="flex items-center gap-2 text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors"
              >
                <User size={19} />
                <span className="hidden sm:inline text-xs font-medium uppercase tracking-wide">
                  Đăng nhập
                </span>
              </Link>

              <div className="absolute right-0 top-full mt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                <div className="bg-[var(--brand-text)] text-white text-xs font-medium px-4 py-2.5 whitespace-nowrap shadow-lg">
                  Đăng nhập để nhận ưu đãi độc quyền
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Menu mobile — dạng accordion, thay thế cho dropdown hover không phù hợp cảm ứng ===== */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--brand-border)] bg-white">
          <nav className="px-6 md:px-12 py-4 flex flex-col text-sm font-medium text-[var(--brand-text)]">
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
