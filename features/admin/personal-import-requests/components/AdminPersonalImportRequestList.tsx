"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  getAdminPersonalImportRequests,
  updateAdminPersonalImportRequestStatus,
} from "@/features/admin/personal-import-requests/api";
import {
  AdminPersonalImportRequest,
  PersonalImportRequestStatus,
} from "@/types/adminPersonalImportRequest";

const STATUS_LABELS: Record<PersonalImportRequestStatus, string> = {
  New: "Mới",
  Contacted: "Đã liên hệ",
  Quoted: "Đã báo giá",
  Completed: "Hoàn tất",
  Cancelled: "Đã hủy",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABELS) as PersonalImportRequestStatus[];

export default function AdminPersonalImportRequestList() {
  const [requests, setRequests] = useState<AdminPersonalImportRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<PersonalImportRequestStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminPersonalImportRequests(statusFilter || undefined);
      setRequests(result.items);
    } catch {
      setError("Không thể tải danh sách yêu cầu");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: PersonalImportRequestStatus) {
    setUpdatingId(id);
    setError(null);
    try {
      await updateAdminPersonalImportRequestStatus(id, { status });
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể cập nhật trạng thái");
      }
    } finally {
      setUpdatingId(null);
    }
  }

  const selectClass =
    "border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)]">
          Yêu cầu đặt hàng xách tay
        </h1>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PersonalImportRequestStatus | "")}
          className={selectClass}
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</p>
      )}

      {requests.length === 0 ? (
        <p className="text-[var(--brand-text-muted)]">Chưa có yêu cầu nào.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="bg-[var(--brand-cream-dark)] p-5">
              <div className="flex items-start justify-between gap-4">
                {r.imageUrl && (
                  <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.imageUrl}
                      alt={r.productName}
                      className="h-16 w-16 object-cover border border-[var(--brand-border)]"
                    />
                  </a>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-heading font-semibold text-[var(--brand-text)]">
                    {r.productName} <span className="font-normal text-[var(--brand-text-muted)]">× {r.quantity}</span>
                  </p>
                  {r.productLink && (
                    <a
                      href={r.productLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--brand-olive)] hover:underline break-all"
                    >
                      {r.productLink}
                    </a>
                  )}
                  {r.notes && (
                    <p className="text-sm text-[var(--brand-text)] mt-2">{r.notes}</p>
                  )}
                  <p className="text-xs text-[var(--brand-text-muted)] mt-2">
                    {r.customerName} — {r.customerPhone}
                    {r.customerEmail && ` — ${r.customerEmail}`}
                  </p>
                  <p className="text-xs text-[var(--brand-text-muted)] mt-1">
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as PersonalImportRequestStatus)}
                  disabled={updatingId === r.id}
                  className={`${selectClass} shrink-0`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
