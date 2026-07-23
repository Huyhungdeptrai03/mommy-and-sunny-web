"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
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
    <div className="flex min-h-screen bg-[var(--brand-cream)]">
      <aside className="w-56 border-r border-[var(--brand-border)] p-6 shrink-0">
        <h2 className="font-heading font-extrabold text-[var(--brand-text)] mb-6">Quản trị</h2>
        <nav className="space-y-3">
          <Link
            href="/admin/dashboard"
            className="block text-sm font-medium text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
          >
            Tổng quan
          </Link>
          <Link
            href="/admin/products"
            className="block text-sm font-medium text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
          >
            Sản phẩm
          </Link>
          <Link
            href="/admin/orders"
            className="block text-sm font-medium text-[var(--brand-text)] hover:text-[var(--brand-olive)] transition-colors"
          >
            Đơn hàng
          </Link>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}