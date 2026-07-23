"use client";

import { useEffect, useState } from "react";
import { getDashboardSummary, getRevenueChart } from "@/features/admin/dashboard/api";
import { formatCurrency } from "@/lib/utils";
import { DashboardSummary, RevenueChartPoint } from "@/types/adminDashboard";

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<RevenueChartPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryData, chart] = await Promise.all([getDashboardSummary(), getRevenueChart(7)]);
      setSummary(summaryData);
      setChartData(chart);
    } catch {
      setError("Không thể tải dữ liệu thống kê");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  if (error || !summary) {
    return <main className="p-8 text-red-600">{error ?? "Không có dữ liệu"}</main>;
  }

  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1);

  const STAT_CARDS = [
    { label: "Doanh thu (đã giao)", value: formatCurrency(summary.totalRevenue), bg: "var(--brand-green)" },
    { label: "Đơn hôm nay", value: summary.ordersToday, bg: "var(--brand-blue)" },
    { label: "Đơn 7 ngày qua", value: summary.ordersThisWeek, bg: "var(--brand-yellow)" },
    { label: "Chờ xác nhận", value: summary.pendingOrdersCount, bg: "var(--brand-pink)" },
  ];

  return (
    <main className="p-8">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] mb-6">
        Tổng quan
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl p-5"
            style={{ backgroundColor: card.bg }}
          >
            <p className="text-sm text-[var(--brand-olive-dark)]">{card.label}</p>
            <p className="font-heading text-xl font-extrabold text-[var(--brand-text)] mt-1">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-[var(--brand-border)] bg-white p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Doanh thu 7 ngày gần nhất
        </h2>
        <div className="flex items-end gap-3 h-48">
          {chartData.map((point) => (
            <div
              key={point.date}
              className="flex-1 flex flex-col items-center justify-end h-full"
            >
              <div
                className="w-full bg-[var(--brand-olive)] rounded-t-lg"
                style={{
                  height: `${(point.revenue / maxRevenue) * 100}%`,
                  minHeight: point.revenue > 0 ? "4px" : "0px",
                }}
                title={formatCurrency(point.revenue)}
              />
              <p className="text-xs text-[var(--brand-text-muted)] mt-2">
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