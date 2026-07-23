"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getCategoryTree } from "@/features/categories/api";
import { createProduct } from "@/features/admin/products/api";
import { Category } from "@/types/category";

function flattenCategories(categories: Category[], prefix = ""): { id: string; label: string }[] {
  return categories.flatMap((c) => [
    { id: c.id, label: prefix + c.name },
    ...flattenCategories(c.children, prefix + "— "),
  ]);
}

export default function ProductCreateForm() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [ageMin, setAgeMin] = useState(0);
  const [ageMax, setAgeMax] = useState(12);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] rounded-xl px-4 py-2 bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  useEffect(() => {
    void getCategoryTree()
      .then(setCategories)
      .catch(() => setError("Không thể tải danh mục"));
  }, []);

  const flatCategories = flattenCategories(categories);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Vui lòng chọn danh mục");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createProduct({
        categoryId,
        name,
        description: description || undefined,
        brand: brand || undefined,
        ageRangeMinMonths: ageMin,
        ageRangeMaxMonths: ageMax,
      });
      router.push(`/admin/products/${created.id}/edit`);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể tạo sản phẩm, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="p-8 max-w-xl">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] mb-6">
        Thêm sản phẩm mới
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white border border-[var(--brand-border)] rounded-2xl p-6"
      >
        <div>
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
            Danh mục
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Chọn danh mục --</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
            Tên sản phẩm
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
            Thương hiệu
          </label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
              Độ tuổi từ (tháng)
            </label>
            <input
              type="number"
              min={0}
              value={ageMin}
              onChange={(e) => setAgeMin(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
              Đến (tháng)
            </label>
            <input
              type="number"
              min={0}
              value={ageMax}
              onChange={(e) => setAgeMax(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
            Mô tả
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[var(--brand-olive)] text-white rounded-full px-6 py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? "Đang tạo..." : "Tạo sản phẩm và tiếp tục"}
        </button>
      </form>
    </main>
  );
}