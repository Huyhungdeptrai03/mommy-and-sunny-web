"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getCategoryTree } from "@/features/categories/api";
import { createProduct } from "@/features/admin/products/api";
import { getAdminPurchaseBatches } from "@/features/admin/purchase-batches/api";
import { Category } from "@/types/category";
import { AdminPurchaseBatch } from "@/types/adminPurchaseBatch";

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
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [purchaseBatches, setPurchaseBatches] = useState<AdminPurchaseBatch[]>([]);
  const [purchaseBatchId, setPurchaseBatchId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] px-4 py-2 bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  useEffect(() => {
    void getCategoryTree()
      .then(setCategories)
      .catch(() => setError("Không thể tải danh mục"));

    // Chỉ cho gán vào đợt hàng đang "Đang mở" — khớp đúng validate ở Backend
    void getAdminPurchaseBatches()
      .then((batches) => setPurchaseBatches(batches.filter((b) => b.status === "Open")))
      .catch(() => {
        // Lỗi tải đợt hàng không nên chặn cả form tạo sản phẩm — im lặng bỏ qua
      });
  }, []);

  const flatCategories = flattenCategories(categories);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Vui lòng chọn danh mục");
      return;
    }
    if (!name.trim()) {
      setError("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (ageMin && ageMax && Number(ageMin) > Number(ageMax)) {
      setError("Độ tuổi tối thiểu không được lớn hơn độ tuổi tối đa");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createProduct({
        categoryId,
        name,
        description: description || undefined,
        brand: brand || undefined,
        ageRangeMinMonths: ageMin ? Number(ageMin) : undefined,
        ageRangeMaxMonths: ageMax ? Number(ageMax) : undefined,
        purchaseBatchId: purchaseBatchId || null,
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
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white border border-[var(--brand-border)] p-6"
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
              Độ tuổi từ (tháng) — không bắt buộc
            </label>
            <input
              type="number"
              min={0}
              placeholder="Bỏ trống nếu sản phẩm không có độ tuổi phù hợp"
              value={ageMin}
              onChange={(e) => setAgeMin(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
              Đến (tháng) — không bắt buộc
            </label>
            <input
              type="number"
              min={0}
              value={ageMax}
              onChange={(e) => setAgeMax(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {purchaseBatches.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
              Thuộc đợt hàng đặt trước — không bắt buộc
            </label>
            <select
              value={purchaseBatchId}
              onChange={(e) => setPurchaseBatchId(e.target.value)}
              className={inputClass}
            >
              <option value="">— Hàng có sẵn, bán ngay —</option>
              {purchaseBatches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.countryOfOrigin ? ` (${b.countryOfOrigin})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

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
          className="bg-[var(--brand-olive)] text-white px-6 py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? "Đang tạo..." : "Tạo sản phẩm và tiếp tục"}
        </button>
      </form>
    </main>
  );
}