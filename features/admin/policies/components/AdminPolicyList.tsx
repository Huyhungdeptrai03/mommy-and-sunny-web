"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getAdminPolicies, updateAdminPolicy } from "@/features/admin/policies/api";
import { AdminPolicy } from "@/types/adminPolicy";

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

export default function AdminPolicyList() {
  const [policies, setPolicies] = useState<AdminPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ title: "", content: "" });
  const [isSaving, setIsSaving] = useState(false);

  const inputClass =
    "border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)] w-full";

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminPolicies();
      setPolicies(data);
    } catch {
      setError("Không thể tải danh sách chính sách");
    } finally {
      setIsLoading(false);
    }
  }

  function startEdit(policy: AdminPolicy) {
    setEditingId(policy.id);
    setEditData({ title: policy.title, content: policy.content });
    setError(null);
  }

  async function handleSaveEdit(id: string) {
    if (!editData.title.trim()) {
      setError("Tiêu đề không được để trống");
      return;
    }
    if (!editData.content.trim()) {
      setError("Nội dung không được để trống");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateAdminPolicy(id, editData);
      setEditingId(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể lưu chính sách"));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-4xl">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-2">
        Quản lý chính sách
      </h1>
      <p className="text-sm text-[var(--brand-text-muted)] mb-6">
        4 trang chính sách cố định hiển thị ở footer — chỉ sửa được tiêu đề và nội dung.
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">{error}</p>
      )}

      <div className="space-y-4">
        {policies.map((p) =>
          editingId === p.id ? (
            <div key={p.id} className="border border-[var(--brand-border)] bg-white p-5">
              <p className="text-xs text-[var(--brand-text-muted)] mb-3">/chinh-sach/{p.slug}</p>
              <input
                value={editData.title}
                onChange={(e) => setEditData((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Tiêu đề"
                className={`${inputClass} mb-3`}
              />
              <textarea
                value={editData.content}
                onChange={(e) => setEditData((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Nội dung"
                rows={10}
                className={inputClass}
              />
              <div className="flex gap-3 justify-end mt-3">
                <button
                  onClick={() => handleSaveEdit(p.id)}
                  disabled={isSaving}
                  className="bg-[var(--brand-olive)] text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? "Đang lưu..." : "Lưu"}
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-[var(--brand-text-muted)] text-sm px-3"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            <div
              key={p.id}
              className="border border-[var(--brand-border)] bg-white p-5 flex items-start justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-heading font-semibold text-[var(--brand-text)]">{p.title}</p>
                <p className="text-xs text-[var(--brand-text-muted)] mt-1">/chinh-sach/{p.slug}</p>
                <p className="text-sm text-[var(--brand-text-muted)] mt-2 line-clamp-2">
                  {p.content}
                </p>
              </div>
              <button
                onClick={() => startEdit(p)}
                className="shrink-0 text-[var(--brand-text)] font-medium text-sm hover:text-[var(--brand-olive)]"
              >
                Sửa
              </button>
            </div>
          )
        )}
      </div>
    </main>
  );
}
