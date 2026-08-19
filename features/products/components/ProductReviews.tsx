"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getProductReviews, canReviewProduct, createReview } from "@/features/products/reviewApi";
import { ProductReviewsData } from "@/types/review";

export default function ProductReviews({ productId }: { productId: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [data, setData] = useState<ProductReviewsData | null>(null);
  const [canReview, setCanReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  async function load() {
    setIsLoading(true);
    try {
      const reviewsData = await getProductReviews(productId);
      setData(reviewsData);

      if (isAuthenticated) {
        const eligible = await canReviewProduct(productId);
        setCanReview(eligible);
      } else {
        setCanReview(false);
      }
    } catch {
      // Lỗi tải đánh giá không nên chặn cả trang sản phẩm
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await createReview(productId, rating, comment || undefined);
      setComment("");
      setRating(5);
      setCanReview(false);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể gửi đánh giá, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-[var(--brand-text-muted)]">Đang tải đánh giá...</p>;
  }

  if (!data) return null;

  return (
    <section className="mt-16">
      <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-6">
        Đánh giá từ khách hàng
      </h2>

      {data.summary.totalCount > 0 ? (
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="text-center md:text-left shrink-0">
            <p className="font-heading text-4xl font-extrabold text-[var(--brand-text)]">
              {data.summary.averageRating.toFixed(1)}
            </p>
            <div className="flex justify-center md:justify-start text-[var(--brand-accent)] mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.round(data.summary.averageRating) ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p className="text-sm text-[var(--brand-text-muted)] mt-1">
              {data.summary.totalCount} đánh giá
            </p>
          </div>

          <div className="flex-1 space-y-1.5 max-w-sm">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = data.summary.ratingBreakdown[star] ?? 0;
              const percent =
                data.summary.totalCount > 0 ? (count / data.summary.totalCount) * 100 : 0;
              return (
                <div
                  key={star}
                  className="flex items-center gap-2 text-xs text-[var(--brand-text-muted)]"
                >
                  <span className="w-10">{star} sao</span>
                  <div className="flex-1 h-1.5 bg-[var(--brand-cream-dark)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--brand-text)]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[var(--brand-text-muted)] mb-8">
          Chưa có đánh giá nào cho sản phẩm này.
        </p>
      )}

      {canReview && (
        <div className="mb-8 border border-[var(--brand-border)] p-5 bg-white">
          <p className="font-heading font-semibold text-[var(--brand-text)] mb-3">
            Viết đánh giá của bạn
          </p>
          <div className="flex gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <button key={i} type="button" onClick={() => setRating(i + 1)}>
                <Star
                  size={22}
                  className="text-[var(--brand-accent)]"
                  fill={i < rating ? "currentColor" : "none"}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ cảm nhận của bạn về sản phẩm (không bắt buộc)"
            rows={3}
            className="w-full border border-[var(--brand-border)] px-4 py-2 text-sm mb-3 focus:outline-none focus:border-[var(--brand-text)]"
          />
          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[var(--brand-olive)] text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {data.items.map((review) => (
          <div key={review.id} className="border-b border-[var(--brand-border)] pb-4">
            <div className="flex items-center justify-between">
              <p className="font-medium text-[var(--brand-text)]">{review.userName}</p>
              <p className="text-xs text-[var(--brand-text-muted)]">
                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
              </p>
            </div>
            <div className="flex text-[var(--brand-accent)] mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} fill={i < review.rating ? "currentColor" : "none"} />
              ))}
            </div>
            {review.comment && (
              <p className="text-sm text-[var(--brand-text)] mt-2">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}