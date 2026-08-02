"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Star } from "lucide-react";
import { getAdminReviews, deleteReview } from "@/features/admin/reviews/api";
import { AdminReview } from "@/types/adminReview";

export default function AdminReviewList() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [ratingFilter, setRatingFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminReviews(ratingFilter ? Number(ratingFilter) : undefined);
      setReviews(result.items);
    } catch {
      setError("Không thể tải danh sách đánh giá");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(review: AdminReview) {
    if (!confirm(`Xóa đánh giá của "${review.userFullName}" cho sản phẩm "${review.productName}"?`)) {
      return;
    }
    setDeletingId(review.id);
    setError(null);
    try {
      await deleteReview(review.id);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể xóa đánh giá");
      }
    } finally {
      setDeletingId(null);
    }
  }

  const selectClass =
    "border border-[var(--brand-border)] rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
          Quản lý đánh giá
        </h1>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Tất cả số sao</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      {reviews.length === 0 ? (
        <p className="text-[var(--brand-text-muted)]">Không có đánh giá nào.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="border border-[var(--brand-border)] bg-white rounded-2xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/products?search=${encodeURIComponent(r.productName)}`}
                    className="font-heading font-semibold text-[var(--brand-text)] hover:text-[var(--brand-olive)]"
                  >
                    {r.productName}
                  </Link>
                  <p className="text-xs text-[var(--brand-text-muted)] mt-1">
                    {r.userFullName} — {r.userEmail}
                  </p>
                  <div className="flex text-[var(--brand-olive)] mt-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-[var(--brand-text)] mt-2">{r.comment}</p>
                  )}
                  <p className="text-xs text-[var(--brand-text-muted)] mt-2">
                    {new Date(r.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(r)}
                  disabled={deletingId === r.id}
                  className="text-red-600 text-sm font-medium hover:underline disabled:opacity-50 shrink-0"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}