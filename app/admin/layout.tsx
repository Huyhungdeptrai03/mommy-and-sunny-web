"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  MessageSquareText,
  Users,
  Ship,
  Ticket,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/orders", label: "Đơn hàng", icon: ShoppingBag },
  { href: "/admin/purchase-batches", label: "Đợt hàng", icon: Ship },
  { href: "/admin/coupons", label: "Mã giảm giá", icon: Ticket },
  { href: "/admin/categories", label: "Danh mục", icon: Tags },
  { href: "/admin/reviews", label: "Đánh giá", icon: MessageSquareText },
  { href: "/admin/users", label: "Người dùng", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!isAuthenticated || user?.role !== "Admin")) {
      router.push("/");
    }
  }, [mounted, isAuthenticated, user, router]);

  if (!mounted || !isAuthenticated || user?.role !== "Admin") {
    return (
      <main className="p-8 text-[var(--brand-text-muted)]">Đang kiểm tra quyền truy cập...</main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--brand-cream)]">
      {/* Thanh trên riêng của Admin — KHÔNG dùng chung Header/TopBar của Storefront,
          vì Admin không cần giỏ hàng/tìm kiếm sản phẩm/menu danh mục khách hàng */}
      <header className="bg-[var(--brand-olive)] text-white shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Crab Bébé" className="h-12 w-12 rounded-full object-cover" />
            <p className="font-heading font-bold tracking-[0.2em] text-sm uppercase">
              Quản trị
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs uppercase tracking-wide">
            <span className="text-white/70">{user?.fullName}</span>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="flex items-center gap-1.5 hover:underline"
            >
              <LogOut size={14} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="w-56 border-r border-[var(--brand-border)] bg-white p-6 shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--brand-olive)] text-white"
                      : "text-[var(--brand-text)] hover:bg-[var(--brand-cream-dark)]"
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}