"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getMonthlyStats, getCustomerStats } from "@/features/admin/stats/api";
import { formatCurrency } from "@/lib/utils";
import { CustomerStatsItem, MonthlyStats } from "@/types/adminStats";

const PAGE_SIZE = 20;

export default function AdminStats() {
  const [monthly, setMonthly] = useState<MonthlyStats[]>([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(true);

  const [customers, setCustomers] = useState<CustomerStatsItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isCustomersLoading, setIsCustomersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadMonthly();
  }, []);

  useEffect(() => {
    void loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function loadMonthly() {
    setIsMonthlyLoading(true);
    try {
      const data = await getMonthlyStats(12);
      setMonthly(data);
    } catch {
      setError("Không thể tải thống kê theo tháng");
    } finally {
      setIsMonthlyLoading(false);
    }
  }

  async function loadCustomers() {
    setIsCustomersLoading(true);
    try {
      const result = await getCustomerStats({ search: search || undefined, page, pageSize: PAGE_SIZE });
      setCustomers(result.items);
      setTotalPages(result.totalPages);
    } catch {
      setError("Không thể tải thống kê theo khách hàng");
    } finally {
      setIsCustomersLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void loadCustomers();
  }

  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);

  return (
    <main className="p-8">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-8">
        Thống kê
      </h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</p>
      )}

      {/* ===== Doanh thu + đơn hàng theo tháng ===== */}
      <section className="mb-12">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Doanh thu &amp; đơn hàng theo tháng (12 tháng gần nhất)
        </h2>
        {isMonthlyLoading ? (
          <p className="text-sm text-[var(--brand-text-muted)]">Đang tải...</p>
        ) : (
          <div className="flex items-end gap-2 h-56 overflow-x-auto bg-[var(--brand-cream-dark)] p-4">
            {monthly.map((m) => (
              <div
                key={`${m.year}-${m.month}`}
                className="flex-1 min-w-[56px] flex flex-col items-center justify-end h-full"
              >
                <p className="text-[10px] text-[var(--brand-text-muted)] mb-1">{m.orderCount} đơn</p>
                <div
                  className="w-full bg-[var(--brand-olive)]"
                  style={{
                    height: `${(m.revenue / maxRevenue) * 100}%`,
                    minHeight: m.revenue > 0 ? "4px" : "0px",
                  }}
                  title={formatCurrency(m.revenue)}
                />
                <p className="text-[10px] text-[var(--brand-text-muted)] mt-2 whitespace-nowrap">
                  {m.month.toString().padStart(2, "0")}/{m.year}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Bảng thống kê theo khách hàng ===== */}
      <section>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
          <h2 className="font-heading font-semibold text-[var(--brand-text)]">
            Đơn hàng &amp; chi tiêu theo khách hàng
          </h2>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]"
            />
            <button
              type="submit"
              className="bg-[var(--brand-olive)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Tìm
            </button>
          </form>
        </div>

        <div className="border border-[var(--brand-border)] bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--brand-cream-dark)] text-left">
              <tr>
                <th className="p-3 font-heading text-[var(--brand-text)]">Khách hàng</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Liên hệ</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Số đơn</th>
                <th className="p-3 font-heading text-[var(--brand-text)]">Tổng chi tiêu</th>
              </tr>
            </thead>
            <tbody>
              {isCustomersLoading ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[var(--brand-text-muted)]">
                    Đang tải...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-[var(--brand-text-muted)]">
                    Không tìm thấy khách hàng nào
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.userId} className="border-t border-[var(--brand-border)]">
                    <td className="p-3 font-medium text-[var(--brand-text)]">{c.fullName}</td>
                    <td className="p-3 text-[var(--brand-text-muted)]">
                      {c.email}
                      {c.phoneNumber && ` — ${c.phoneNumber}`}
                    </td>
                    <td className="p-3 text-[var(--brand-text)]">{c.orderCount}</td>
                    <td className="p-3 text-[var(--brand-text)] font-semibold">
                      {formatCurrency(c.totalSpent)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <nav className="mt-6 flex items-center justify-center gap-6" aria-label="Phân trang">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Trước
            </button>
            <span className="text-xs text-[var(--brand-text-muted)]">
              Trang {page}/{totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-xs font-medium uppercase tracking-widest text-[var(--brand-text)] hover:text-[var(--brand-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Sau
              <ChevronRight size={14} />
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
