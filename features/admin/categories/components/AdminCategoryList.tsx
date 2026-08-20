"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/features/admin/categories/api";
import { isValidUrl } from "@/lib/validation";
import { AdminCategory } from "@/types/adminCategory";

// Sắp xếp danh mục theo dạng cây (cha trước, con sau, thụt lề) để hiển thị dropdown
// và bảng dễ nhìn — dữ liệu gốc từ API là mảng phẳng có parentCategoryId
function buildIndentedList(categories: AdminCategory[]): { id: string; label: string }[] {
  const byParent: Record<string, AdminCategory[]> = {};
  categories.forEach((c) => {
    const key = c.parentCategoryId ?? "root";
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(c);
  });

  const result: { id: string; label: string }[] = [];
  function walk(parentKey: string, depth: number) {
    const children = byParent[parentKey] ?? [];
    children.forEach((c) => {
      result.push({ id: c.id, label: `${"— ".repeat(depth)}${c.name}` });
      walk(c.id, depth + 1);
    });
  }
  walk("root", 0);
  return result;
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

export default function AdminCategoryList() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ name: "", parentCategoryId: "", imageUrl: "" });

  const inputClass =
    "border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminCategories();
      setCategories(data);
    } catch {
      setError("Không thể tải danh sách danh mục");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      setError("Tên danh mục không được để trống");
      return;
    }
    if (newImageUrl.trim() && !isValidUrl(newImageUrl)) {
      setError("URL ảnh không hợp lệ");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createCategory({
        name: newName,
        parentCategoryId: newParentId || null,
        imageUrl: newImageUrl || null,
      });
      setNewName("");
      setNewParentId("");
      setNewImageUrl("");
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể tạo danh mục"));
    } finally {
      setIsCreating(false);
    }
  }

  function startEdit(category: AdminCategory) {
    setEditingId(category.id);
    setEditData({
      name: category.name,
      parentCategoryId: category.parentCategoryId ?? "",
      imageUrl: category.imageUrl ?? "",
    });
  }

  async function handleSaveEdit(id: string) {
    if (!editData.name.trim()) {
      setError("Tên danh mục không được để trống");
      return;
    }
    if (editData.imageUrl.trim() && !isValidUrl(editData.imageUrl)) {
      setError("URL ảnh không hợp lệ");
      return;
    }
    setError(null);
    try {
      await updateCategory(id, {
        name: editData.name,
        parentCategoryId: editData.parentCategoryId || null,
        imageUrl: editData.imageUrl || null,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể lưu danh mục"));
    }
  }

  async function handleDelete(category: AdminCategory) {
    if (!confirm(`Xóa danh mục "${category.name}"?`)) return;
    setError(null);
    try {
      await deleteCategory(category.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể xóa danh mục"));
    }
  }

  const indentedOptions = buildIndentedList(categories);

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-4xl">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-6">
        Quản lý danh mục
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      {/* Form tạo mới */}
      <section className="mb-8 bg-[var(--brand-cream-dark)] p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Thêm danh mục mới
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={newParentId}
            onChange={(e) => setNewParentId(e.target.value)}
            className={inputClass}
          >
            <option value="">— Không có danh mục cha (danh mục gốc) —</option>
            {indentedOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            placeholder="Tên danh mục"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className={inputClass}
          />
          <input
            placeholder="URL ảnh (không bắt buộc)"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="mt-4 bg-[var(--brand-olive)] text-white px-6 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isCreating ? "Đang tạo..." : "Thêm danh mục"}
        </button>
      </section>

      {/* Bảng danh sách */}
      <div className=" border border-[var(--brand-border)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-cream-dark)] text-left">
            <tr>
              <th className="p-3 font-heading text-[var(--brand-text)]">Danh mục cha</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Tên</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Số sản phẩm</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-[var(--brand-text-muted)]">
                  Chưa có danh mục nào
                </td>
              </tr>
            ) : (
              categories.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id} className="border-t border-[var(--brand-border)]">
                    <td className="p-3" colSpan={4}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <select
                          value={editData.parentCategoryId}
                          onChange={(e) =>
                            setEditData((p) => ({ ...p, parentCategoryId: e.target.value }))
                          }
                          className={inputClass}
                        >
                          <option value="">— Không có danh mục cha —</option>
                          {indentedOptions
                            .filter((opt) => opt.id !== c.id)
                            .map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                        </select>
                        <input
                          value={editData.name}
                          onChange={(e) =>
                            setEditData((p) => ({ ...p, name: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <input
                          placeholder="URL ảnh"
                          value={editData.imageUrl}
                          onChange={(e) =>
                            setEditData((p) => ({ ...p, imageUrl: e.target.value }))
                          }
                          className={inputClass}
                        />
                      </div>
                      <div className="flex gap-3 justify-end mt-2">
                        <button
                          onClick={() => handleSaveEdit(c.id)}
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
                    </td>
                  </tr>
                ) : (
                  <tr key={c.id} className="border-t border-[var(--brand-border)]">
                    <td className="p-3 text-[var(--brand-text-muted)]">
                      {c.parentCategoryName ?? "—"}
                    </td>
                    <td className="p-3 font-medium text-[var(--brand-text)]">{c.name}</td>
                    <td className="p-3 text-[var(--brand-text)]">{c.productCount}</td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-[var(--brand-text)] font-medium hover:text-[var(--brand-olive)]"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="text-red-600 font-medium hover:underline"
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