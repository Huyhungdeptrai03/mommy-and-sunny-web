"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { getAdminArticleComments, deleteAdminArticleComment } from "@/features/admin/article-comments/api";
import { AdminArticleComment } from "@/types/adminArticleComment";

export default function AdminArticleCommentList() {
  const [comments, setComments] = useState<AdminArticleComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminArticleComments();
      setComments(result.items);
    } catch {
      setError("Không thể tải danh sách bình luận");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(comment: AdminArticleComment) {
    if (!confirm(`Xóa bình luận của "${comment.userFullName}"?`)) return;
    setDeletingId(comment.id);
    setError(null);
    try {
      await deleteAdminArticleComment(comment.id);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể xóa bình luận");
      }
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-4xl">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-6">
        Quản lý bình luận bài viết
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</p>
      )}

      {comments.length === 0 ? (
        <p className="text-[var(--brand-text-muted)]">Chưa có bình luận nào.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="bg-[var(--brand-cream-dark)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link
                    href={`/tin-tuc/${c.articleSlug}`}
                    className="font-heading font-semibold text-[var(--brand-text)] hover:text-[var(--brand-olive)]"
                  >
                    {c.articleTitle}
                  </Link>
                  <p className="text-xs text-[var(--brand-text-muted)] mt-1">
                    {c.userFullName} — {c.userEmail}
                  </p>
                  <p className="text-sm text-[var(--brand-text)] mt-2 whitespace-pre-line">
                    {c.content}
                  </p>
                  <p className="text-xs text-[var(--brand-text-muted)] mt-2">
                    {new Date(c.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(c)}
                  disabled={deletingId === c.id}
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
