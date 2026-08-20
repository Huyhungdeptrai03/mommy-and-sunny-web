"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { getArticleComments, createArticleComment } from "@/features/articles/api";
import { ArticleComment } from "@/types/article";

export default function ArticleComments({ articleId }: { articleId: string }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, [articleId]);

  async function load() {
    setIsLoading(true);
    try {
      const data = await getArticleComments(articleId);
      setComments(data);
    } catch {
      // Lỗi tải bình luận không nên chặn cả trang bài viết
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!content.trim()) {
      setError("Nội dung bình luận không được để trống");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await createArticleComment(articleId, content.trim());
      setContent("");
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể gửi bình luận, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-16 border-t border-[var(--brand-border)] pt-10">
      <h2 className="font-heading text-lg font-bold uppercase tracking-tight text-[var(--brand-text)] mb-6">
        Bình luận {comments.length > 0 && `(${comments.length})`}
      </h2>

      {isAuthenticated ? (
        <div className="mb-8">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
            rows={3}
            className="w-full border border-[var(--brand-border)] px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--brand-text)]"
          />
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="mt-3 bg-[var(--brand-olive)] text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
          </button>
        </div>
      ) : (
        <p className="mb-8 text-sm text-[var(--brand-text-muted)]">
          <Link href="/login" className="text-[var(--brand-text)] font-medium hover:underline">
            Đăng nhập
          </Link>{" "}
          để để lại bình luận.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-[var(--brand-text-muted)]">Đang tải bình luận...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-[var(--brand-text-muted)]">
          Chưa có bình luận nào — hãy là người đầu tiên.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="border-b border-[var(--brand-border)] pb-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-[var(--brand-text)]">{c.userFullName}</p>
                <p className="text-xs text-[var(--brand-text-muted)]">
                  {new Date(c.createdAt).toLocaleDateString("vi-VN")}
                </p>
              </div>
              <p className="text-sm text-[var(--brand-text)] mt-2 whitespace-pre-line">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
