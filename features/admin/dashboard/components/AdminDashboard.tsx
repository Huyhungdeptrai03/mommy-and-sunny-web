"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary, getRevenueChart } from "@/features/admin/dashboard/api";
import { formatCurrency } from "@/lib/utils";
import { DashboardSummary, RevenueChartPoint } from "@/types/adminDashboard";

function toDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);

  const [fromDate, setFromDate] = useState(toDateInputValue(sevenDaysAgo));
  const [toDate, setToDate] = useState(toDateInputValue(today));

  useEffect(() => {
    void loadSummary();
    void loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSummary() {
    setIsLoading(true);
    setError(null);
    try {
      const summaryData = await getDashboardSummary();
      setSummary(summaryData);
    } catch {
      setError("Không thể tải dữ liệu thống kê");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadChart() {
    setIsChartLoading(true);
    setError(null);
    try {
      const chart = await getRevenueChart({ fromDate, toDate });
      setChartData(chart);
    } catch {
      setError("Không thể tải dữ liệu doanh thu cho khoảng ngày đã chọn");
    } finally {
      setIsChartLoading(false);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  if (error && !summary) {
    return <main className="p-8 text-red-600">{error}</main>;
  }

  if (!summary) return null;

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);
  const totalRevenueInRange = chartData.reduce((sum, d) => sum + d.revenue, 0);

  const STAT_CARDS = [
    { label: "Doanh thu (đã giao)", value: formatCurrency(summary.totalRevenue), bg: "var(--brand-green)" },
    { label: "Đơn hôm nay", value: summary.ordersToday, bg: "var(--brand-blue)" },
    { label: "Đơn 7 ngày qua", value: summary.ordersThisWeek, bg: "var(--brand-yellow)" },
    { label: "Chờ xác nhận", value: summary.pendingOrdersCount, bg: "var(--brand-pink)" },
  ];

  const inputClass =
    "border border-[var(--brand-border)] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  return (
    <main className="p-8">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] mb-6">
        Tổng quan
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div key={card.label} className="rounded-2xl p-5" style={{ backgroundColor: card.bg }}>
            <p className="text-sm text-[var(--brand-olive-dark)]">{card.label}</p>
            <p className="font-heading text-xl font-extrabold text-[var(--brand-text)] mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--brand-border)] bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-heading font-semibold text-[var(--brand-text)]">
              Doanh thu theo khoảng ngày
            </h2>
            <p className="text-sm text-[var(--brand-text-muted)] mt-1">
              Chọn khoảng ngày để tra cứu doanh thu cụ thể (tối đa 90 ngày)
            </p>
          </div>

          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-xs text-[var(--brand-text-muted)] mb-1">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              onClick={loadChart}
              disabled={isChartLoading}
              className="bg-[var(--brand-olive)] text-white rounded-xl px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isChartLoading ? "Đang tải..." : "Xem"}
            </button>
          </div>
        </div>

        {error && chartData.length === 0 && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        <div className="mb-4">
          <p className="text-sm text-[var(--brand-text-muted)]">
            Tổng doanh thu khoảng đã chọn
          </p>
          <p className="font-heading text-2xl font-extrabold text-[var(--brand-olive)]">
            {formatCurrency(totalRevenueInRange)}
          </p>
        </div>

        <div className="flex items-end gap-2 h-48 overflow-x-auto">
          {chartData.map((point) => (
            <div
              key={point.date}
              className="flex-1 min-w-[28px] flex flex-col items-center justify-end h-full"
            >
              <div
                className="w-full bg-[var(--brand-olive)] rounded-t-lg"
                style={{
                  height: `${(point.revenue / maxRevenue) * 100}%`,
                  minHeight: point.revenue > 0 ? "4px" : "0px",
                }}
                title={formatCurrency(point.revenue)}
              />
              <p className="text-[10px] text-[var(--brand-text-muted)] mt-2 whitespace-nowrap">
                {new Date(point.date).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}