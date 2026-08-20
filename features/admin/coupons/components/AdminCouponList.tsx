"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  CouponPayload,
} from "@/features/admin/coupons/api";
import { getCategoryTree } from "@/features/categories/api";
import { formatCurrency } from "@/lib/utils";
import { AdminCoupon } from "@/types/adminCoupon";
import { Category } from "@/types/category";

function flattenCategories(categories: Category[], prefix = ""): { id: string; label: string }[] {
  return categories.flatMap((c) => [
    { id: c.id, label: prefix + c.name },
    ...flattenCategories(c.children, prefix + "— "),
  ]);
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

function toDateInputValue(iso: string): string {
  return iso.slice(0, 10);
}

const emptyForm = {
  code: "",
  discountType: "Percentage",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderValue: "",
  categoryId: "",
  startDate: "",
  endDate: "",
  totalUsageLimit: "",
};

type FormState = typeof emptyForm;

export default function AdminCouponList() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const inputClass =
    "border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)] w-full";
  const flatCategories = flattenCategories(categories);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const [couponData, categoryData] = await Promise.all([
        getAdminCoupons(),
        getCategoryTree(),
      ]);
      setCoupons(couponData);
      setCategories(categoryData);
    } catch {
      setError("Không thể tải danh sách mã giảm giá");
    } finally {
      setIsLoading(false);
    }
  }

  // Dùng chung cho cả tạo mới và sửa — trả về thông báo lỗi đầu tiên gặp phải, null nếu hợp lệ
  function validateForm(form: FormState): string | null {
    const discountValue = Number(form.discountValue);
    if (!form.discountValue || discountValue <= 0) {
      return "Giá trị giảm phải lớn hơn 0";
    }
    if (form.discountType === "Percentage" && discountValue > 100) {
      return "Giảm giá theo % không được vượt quá 100%";
    }
    if (form.maxDiscountAmount && Number(form.maxDiscountAmount) < 0) {
      return "Số tiền giảm tối đa không được âm";
    }
    if (form.minOrderValue && Number(form.minOrderValue) < 0) {
      return "Đơn tối thiểu không được âm";
    }
    if (form.totalUsageLimit && Number(form.totalUsageLimit) <= 0) {
      return "Tổng lượt dùng phải lớn hơn 0";
    }
    if (form.startDate && form.endDate && new Date(form.endDate) <= new Date(form.startDate)) {
      return "Ngày kết thúc phải sau ngày bắt đầu";
    }
    return null;
  }

  function buildPayload(form: FormState, includeCode: boolean): CouponPayload {
    return {
      ...(includeCode ? { code: form.code } : {}),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
      categoryId: form.categoryId || null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : "",
      endDate: form.endDate ? new Date(form.endDate).toISOString() : "",
      totalUsageLimit: form.totalUsageLimit ? Number(form.totalUsageLimit) : null,
    };
  }

  async function handleCreate() {
    if (!newForm.code.trim() || !newForm.discountValue || !newForm.startDate || !newForm.endDate) {
      setError("Vui lòng nhập đủ mã, giá trị giảm, ngày bắt đầu và kết thúc");
      return;
    }
    const validationError = validateForm(newForm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createCoupon(buildPayload(newForm, true));
      setNewForm(emptyForm);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể tạo mã giảm giá"));
    } finally {
      setIsCreating(false);
    }
  }

  function startEdit(coupon: AdminCoupon) {
    setEditingId(coupon.id);
    setEditForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscountAmount: coupon.maxDiscountAmount ? String(coupon.maxDiscountAmount) : "",
      minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
      categoryId: coupon.categoryId ?? "",
      startDate: toDateInputValue(coupon.startDate),
      endDate: toDateInputValue(coupon.endDate),
      totalUsageLimit: coupon.totalUsageLimit ? String(coupon.totalUsageLimit) : "",
    });
  }

  async function handleSaveEdit(id: string, isActive: boolean) {
    const validationError = validateForm(editForm);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await updateCoupon(id, { ...buildPayload(editForm, false), isActive });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể lưu mã giảm giá"));
    }
  }

  async function handleToggleActive(coupon: AdminCoupon) {
    setError(null);
    try {
      await updateCoupon(coupon.id, {
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        maxDiscountAmount: coupon.maxDiscountAmount,
        minOrderValue: coupon.minOrderValue,
        categoryId: coupon.categoryId,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        totalUsageLimit: coupon.totalUsageLimit,
        isActive: !coupon.isActive,
      });
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể đổi trạng thái"));
    }
  }

  async function handleDelete(coupon: AdminCoupon) {
    if (!confirm(`Xóa mã "${coupon.code}"? Đơn hàng cũ đã dùng mã này vẫn giữ nguyên lịch sử.`)) {
      return;
    }
    setError(null);
    try {
      await deleteCoupon(coupon.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể xóa mã giảm giá"));
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-5xl">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-8">
        Mã giảm giá
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      {/* ===== Form tạo mã mới ===== */}
      <section className="mb-8 bg-[var(--brand-cream-dark)] p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Tạo mã giảm giá mới
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Mã (VD: SALE10)
            </label>
            <input
              value={newForm.code}
              onChange={(e) => setNewForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Loại giảm giá
            </label>
            <select
              value={newForm.discountType}
              onChange={(e) => setNewForm((p) => ({ ...p, discountType: e.target.value }))}
              className={inputClass}
            >
              <option value="Percentage">Theo % </option>
              <option value="FixedAmount">Số tiền cố định (đ)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Giá trị giảm {newForm.discountType === "Percentage" ? "(%)" : "(đ)"}
            </label>
            <input
              type="number"
              min={0}
              max={newForm.discountType === "Percentage" ? 100 : undefined}
              value={newForm.discountValue}
              onChange={(e) => setNewForm((p) => ({ ...p, discountValue: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Giảm tối đa (đ) — chỉ áp cho %
            </label>
            <input
              type="number"
              placeholder="Không giới hạn"
              value={newForm.maxDiscountAmount}
              onChange={(e) => setNewForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Đơn tối thiểu (đ)
            </label>
            <input
              type="number"
              placeholder="Không yêu cầu"
              value={newForm.minOrderValue}
              onChange={(e) => setNewForm((p) => ({ ...p, minOrderValue: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Giới hạn danh mục
            </label>
            <select
              value={newForm.categoryId}
              onChange={(e) => setNewForm((p) => ({ ...p, categoryId: e.target.value }))}
              className={inputClass}
            >
              <option value="">Toàn bộ đơn hàng</option>
              {flatCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Tổng lượt dùng
            </label>
            <input
              type="number"
              placeholder="Không giới hạn"
              value={newForm.totalUsageLimit}
              onChange={(e) => setNewForm((p) => ({ ...p, totalUsageLimit: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Ngày bắt đầu
            </label>
            <input
              type="date"
              value={newForm.startDate}
              onChange={(e) => setNewForm((p) => ({ ...p, startDate: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Ngày kết thúc
            </label>
            <input
              type="date"
              value={newForm.endDate}
              onChange={(e) => setNewForm((p) => ({ ...p, endDate: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="mt-4 bg-[var(--brand-olive)] text-white px-6 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isCreating ? "Đang tạo..." : "Tạo mã"}
        </button>
        <p className="text-xs text-[var(--brand-text-muted)] mt-2">
          Mỗi khách hàng chỉ dùng được mỗi mã tối đa 1 lần — quy tắc cố định, áp dụng cho mọi mã.
        </p>
      </section>

      {/* ===== Danh sách ===== */}
      <div className=" border border-[var(--brand-border)] bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-cream-dark)] text-left">
            <tr>
              <th className="p-3 whitespace-nowrap">Mã</th>
              <th className="p-3 whitespace-nowrap">Giảm giá</th>
              <th className="p-3 whitespace-nowrap">Phạm vi</th>
              <th className="p-3 whitespace-nowrap">Hiệu lực</th>
              <th className="p-3 whitespace-nowrap">Đã dùng</th>
              <th className="p-3 whitespace-nowrap">Trạng thái</th>
              <th className="p-3 whitespace-nowrap">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-[var(--brand-text-muted)]">
                  Chưa có mã giảm giá nào
                </td>
              </tr>
            ) : (
              coupons.map((c) =>
                editingId === c.id ? (
                  <tr key={c.id} className="border-t border-[var(--brand-border)]">
                    <td colSpan={7} className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <select
                          value={editForm.discountType}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, discountType: e.target.value }))
                          }
                          className={inputClass}
                        >
                          <option value="Percentage">Theo %</option>
                          <option value="FixedAmount">Số tiền cố định</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Giá trị giảm"
                          value={editForm.discountValue}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, discountValue: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <input
                          type="number"
                          placeholder="Giảm tối đa (đ)"
                          value={editForm.maxDiscountAmount}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, maxDiscountAmount: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <input
                          type="number"
                          placeholder="Đơn tối thiểu (đ)"
                          value={editForm.minOrderValue}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, minOrderValue: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <select
                          value={editForm.categoryId}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, categoryId: e.target.value }))
                          }
                          className={inputClass}
                        >
                          <option value="">Toàn bộ đơn hàng</option>
                          {flatCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          placeholder="Tổng lượt dùng"
                          value={editForm.totalUsageLimit}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, totalUsageLimit: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <input
                          type="date"
                          value={editForm.startDate}
                          onChange={(e) =>
                            setEditForm((p) => ({ ...p, startDate: e.target.value }))
                          }
                          className={inputClass}
                        />
                        <input
                          type="date"
                          value={editForm.endDate}
                          onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => handleSaveEdit(c.id, c.isActive)}
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
                    <td className="p-3 font-mono font-semibold text-[var(--brand-text)]">
                      {c.code}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {c.discountType === "Percentage"
                        ? `${c.discountValue}%${c.maxDiscountAmount ? ` (tối đa ${formatCurrency(c.maxDiscountAmount)})` : ""}`
                        : formatCurrency(c.discountValue)}
                    </td>
                    <td className="p-3 whitespace-nowrap">{c.categoryName ?? "Toàn đơn"}</td>
                    <td className="p-3 whitespace-nowrap text-xs text-[var(--brand-text-muted)]">
                      {new Date(c.startDate).toLocaleDateString("vi-VN")} -{" "}
                      {new Date(c.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {c.usageCount}
                      {c.totalUsageLimit ? ` / ${c.totalUsageLimit}` : ""}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleActive(c)}
                        className={`text-xs font-semibold px-3 py-1 ${
                          c.isActive
                            ? "bg-[var(--brand-green)] text-[var(--brand-olive-dark)]"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {c.isActive ? "Đang bật" : "Đã tắt"}
                      </button>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-[var(--brand-text)] text-xs font-medium hover:text-[var(--brand-olive)]"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
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