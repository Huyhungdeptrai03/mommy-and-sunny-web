"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  getAdminArticles,
  getAdminArticleById,
  createArticle,
  updateArticle,
  updateArticleStatus,
  deleteArticle,
  ArticlePayload,
} from "@/features/admin/articles/api";
import { AdminArticleListItem } from "@/types/adminArticle";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

const emptyForm = {
  title: "",
  category: "News",
  authorName: "",
  coverImageUrl: "",
  excerpt: "",
  content: "",
};

type FormState = typeof emptyForm;

function toPayload(form: FormState): ArticlePayload {
  return {
    title: form.title,
    category: form.category,
    authorName: form.authorName || null,
    coverImageUrl: form.coverImageUrl || null,
    excerpt: form.excerpt || null,
    content: form.content,
  };
}

export default function AdminArticleList() {
  const [articles, setArticles] = useState<AdminArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  const inputClass =
    "border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)] w-full";

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminArticles({ pageSize: 100 });
      setArticles(result.items);
    } catch {
      setError("Không thể tải danh sách bài viết");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!newForm.title.trim() || !newForm.content.trim()) {
      setError("Vui lòng nhập tiêu đề và nội dung");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createArticle(toPayload(newForm));
      setNewForm(emptyForm);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể tạo bài viết"));
    } finally {
      setIsCreating(false);
    }
  }

  async function startEdit(article: AdminArticleListItem) {
    setEditingId(article.id);
    setIsLoadingEdit(true);
    setError(null);
    try {
      // Danh sách không kèm Excerpt/Content (tránh tải nặng) — phải gọi lấy chi tiết
      // để form sửa có đúng nội dung hiện tại, không để trống rồi lỡ tay ghi đè rỗng
      const full = await getAdminArticleById(article.id);
      setEditForm({
        title: full.title,
        category: full.category,
        authorName: full.authorName ?? "",
        coverImageUrl: full.coverImageUrl ?? "",
        excerpt: full.excerpt ?? "",
        content: full.content,
      });
    } catch (err) {
      setEditingId(null);
      setError(extractErrorMessage(err, "Không thể tải bài viết để sửa"));
    } finally {
      setIsLoadingEdit(false);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editForm.title.trim()) {
      setError("Vui lòng nhập tiêu đề");
      return;
    }
    setError(null);
    try {
      await updateArticle(id, toPayload(editForm));
      setEditingId(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể lưu bài viết"));
    }
  }

  async function handleToggleStatus(article: AdminArticleListItem) {
    setPendingStatusId(article.id);
    setError(null);
    try {
      const nextStatus = article.status === "Published" ? "Draft" : "Published";
      await updateArticleStatus(article.id, nextStatus);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể đổi trạng thái"));
    } finally {
      setPendingStatusId(null);
    }
  }

  async function handleDelete(article: AdminArticleListItem) {
    if (!confirm(`Xóa bài viết "${article.title}"? Không thể hoàn tác.`)) {
      return;
    }
    setError(null);
    try {
      await deleteArticle(article.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể xóa bài viết"));
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-5xl">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-8">
        Bài viết
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</p>
      )}

      {/* ===== Form tạo bài viết mới ===== */}
      <section className="mb-8 bg-[var(--brand-cream-dark)] p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Viết bài mới
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">Tiêu đề</label>
            <input
              value={newForm.title}
              onChange={(e) => setNewForm((p) => ({ ...p, title: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">Chuyên mục</label>
            <select
              value={newForm.category}
              onChange={(e) => setNewForm((p) => ({ ...p, category: e.target.value }))}
              className={inputClass}
            >
              <option value="News">Tin tức</option>
              <option value="Library">Thư viện</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Tác giả (không bắt buộc)
            </label>
            <input
              value={newForm.authorName}
              onChange={(e) => setNewForm((p) => ({ ...p, authorName: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Ảnh bìa — URL (không bắt buộc)
            </label>
            <input
              value={newForm.coverImageUrl}
              onChange={(e) => setNewForm((p) => ({ ...p, coverImageUrl: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Tóm tắt ngắn (hiện ở trang danh sách)
            </label>
            <input
              value={newForm.excerpt}
              onChange={(e) => setNewForm((p) => ({ ...p, excerpt: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Nội dung — để dòng trống giữa các đoạn văn
            </label>
            <textarea
              value={newForm.content}
              onChange={(e) => setNewForm((p) => ({ ...p, content: e.target.value }))}
              rows={8}
              className={inputClass}
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="bg-[var(--brand-olive)] text-white px-6 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isCreating ? "Đang tạo..." : "Tạo bài viết"}
        </button>
        <p className="text-xs text-[var(--brand-text-muted)] mt-2">
          Bài mới luôn ở trạng thái Nháp — bấm &quot;Xuất bản&quot; ở danh sách bên dưới khi sẵn sàng.
        </p>
      </section>

      {/* ===== Danh sách ===== */}
      <div className="border border-[var(--brand-border)] bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-cream-dark)] text-left">
            <tr>
              <th className="p-3 whitespace-nowrap">Tiêu đề</th>
              <th className="p-3 whitespace-nowrap">Chuyên mục</th>
              <th className="p-3 whitespace-nowrap">Ngày đăng</th>
              <th className="p-3 whitespace-nowrap">Trạng thái</th>
              <th className="p-3 whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {articles.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-[var(--brand-text-muted)]">
                  Chưa có bài viết nào
                </td>
              </tr>
            ) : (
              articles.map((a) =>
                editingId === a.id ? (
                  <tr key={a.id} className="border-t border-[var(--brand-border)]">
                    <td colSpan={5} className="p-4">
                      {isLoadingEdit ? (
                        <p className="text-sm text-[var(--brand-text-muted)]">Đang tải...</p>
                      ) : (
                        <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input
                          placeholder="Tiêu đề"
                          value={editForm.title}
                          onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                          className={inputClass}
                        />
                        <select
                          value={editForm.category}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, category: e.target.value }))
                          }
                          className={inputClass}
                        >
                          <option value="News">Tin tức</option>
                          <option value="Library">Thư viện</option>
                        </select>
                        <input
                          placeholder="Tác giả"
                          value={editForm.authorName}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, authorName: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <input
                          placeholder="Ảnh bìa — URL"
                          value={editForm.coverImageUrl}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, coverImageUrl: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <input
                          placeholder="Tóm tắt ngắn"
                          value={editForm.excerpt}
                          onChange={(e) => setEditForm((p) => ({ ...p, excerpt: e.target.value }))}
                          className={`${inputClass} md:col-span-2`}
                        />
                        <textarea
                          placeholder="Nội dung"
                          value={editForm.content}
                          onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value }))}
                          rows={8}
                          className={`${inputClass} md:col-span-2`}
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => handleSaveEdit(a.id)}
                          className="text-[var(--brand-olive)] text-sm font-medium hover:underline"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-[var(--brand-text-muted)] text-sm"
                        >
                          Hủy
                        </button>
                      </div>
                        </>
                      )}
                    </td>
                  </tr>
                ) : (
                  <tr key={a.id} className="border-t border-[var(--brand-border)]">
                    <td className="p-3 font-medium text-[var(--brand-text)] max-w-xs truncate">
                      {a.status === "Published" ? (
                        <Link
                          href={`/${a.category === "News" ? "tin-tuc" : "thu-vien"}/${a.slug}`}
                          target="_blank"
                          className="hover:underline"
                        >
                          {a.title}
                        </Link>
                      ) : (
                        a.title
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {a.category === "News" ? "Tin tức" : "Thư viện"}
                    </td>
                    <td className="p-3 whitespace-nowrap text-xs text-[var(--brand-text-muted)]">
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleStatus(a)}
                        disabled={pendingStatusId === a.id}
                        className={`text-xs font-semibold px-3 py-1 disabled:opacity-50 ${
                          a.status === "Published"
                            ? "bg-[var(--brand-green)] text-[var(--brand-olive-dark)]"
                            : "bg-[var(--brand-yellow)] text-[var(--brand-text)]"
                        }`}
                      >
                        {a.status === "Published" ? "Đã xuất bản" : "Nháp"}
                      </button>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(a)}
                          className="text-[var(--brand-text)] text-xs font-medium hover:text-[var(--brand-olive)]"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="text-red-600 text-xs font-medium hover:underline"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
