"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  getAdminPurchaseBatches,
  createPurchaseBatch,
  updatePurchaseBatch,
  updatePurchaseBatchStatus,
  deletePurchaseBatch,
} from "@/features/admin/purchase-batches/api";
import { AdminPurchaseBatch } from "@/types/adminPurchaseBatch";

const STATUS_LABELS: Record<string, string> = {
  Open: "Đang mở",
  Closed: "Đã chốt đơn",
  Purchasing: "Đang mua hàng",
  Shipping: "Đang vận chuyển",
  Arrived: "Đã về kho",
  Completed: "Hoàn tất",
  Cancelled: "Đã hủy",
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-[var(--brand-green)] text-[var(--brand-olive-dark)]",
  Closed: "bg-[var(--brand-yellow)] text-[var(--brand-olive-dark)]",
  Purchasing: "bg-[var(--brand-blue)] text-[var(--brand-olive-dark)]",
  Shipping: "bg-[var(--brand-blue)] text-[var(--brand-olive-dark)]",
  Arrived: "bg-[var(--brand-pink)] text-[var(--brand-olive-dark)]",
  Completed: "bg-[var(--brand-olive)] text-white",
  Cancelled: "bg-red-100 text-red-700",
};

// Khớp đúng state machine ở Backend — chỉ dùng để hiện đúng nút bấm, Backend vẫn là
// nơi validate thật sự (FE chỉ là gợi ý UX, không phải lớp bảo mật)
const VALID_TRANSITIONS: Record<string, string[]> = {
  Open: ["Closed", "Cancelled"],
  Closed: ["Purchasing", "Cancelled"],
  Purchasing: ["Shipping"],
  Shipping: ["Arrived"],
  Arrived: ["Completed"],
  Completed: [],
  Cancelled: [],
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

export default function AdminPurchaseBatchList() {
  const [batches, setBatches] = useState<AdminPurchaseBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newBatch, setNewBatch] = useState({
    name: "",
    countryOfOrigin: "",
    openDate: "",
    closeDate: "",
    estimatedArrivalDate: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    countryOfOrigin: "",
    openDate: "",
    closeDate: "",
    estimatedArrivalDate: "",
  });

  const inputClass =
    "border border-[var(--brand-border)] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAdminPurchaseBatches();
      setBatches(data);
    } catch {
      setError("Không thể tải danh sách đợt hàng");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreate() {
    if (!newBatch.name.trim() || !newBatch.openDate || !newBatch.closeDate) {
      setError("Vui lòng nhập đủ tên, ngày mở và ngày chốt đơn");
      return;
    }
    setIsCreating(true);
    setError(null);
    try {
      await createPurchaseBatch({
        name: newBatch.name,
        countryOfOrigin: newBatch.countryOfOrigin || null,
        openDate: new Date(newBatch.openDate).toISOString(),
        closeDate: new Date(newBatch.closeDate).toISOString(),
        estimatedArrivalDate: newBatch.estimatedArrivalDate
          ? new Date(newBatch.estimatedArrivalDate).toISOString()
          : null,
      });
      setNewBatch({
        name: "",
        countryOfOrigin: "",
        openDate: "",
        closeDate: "",
        estimatedArrivalDate: "",
      });
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể tạo đợt hàng"));
    } finally {
      setIsCreating(false);
    }
  }

  function startEdit(batch: AdminPurchaseBatch) {
    setEditingId(batch.id);
    setEditData({
      name: batch.name,
      countryOfOrigin: batch.countryOfOrigin ?? "",
      openDate: toDateInputValue(batch.openDate),
      closeDate: toDateInputValue(batch.closeDate),
      estimatedArrivalDate: toDateInputValue(batch.estimatedArrivalDate),
    });
  }

  async function handleSaveEdit(id: string) {
    setError(null);
    try {
      await updatePurchaseBatch(id, {
        name: editData.name,
        countryOfOrigin: editData.countryOfOrigin || null,
        openDate: new Date(editData.openDate).toISOString(),
        closeDate: new Date(editData.closeDate).toISOString(),
        estimatedArrivalDate: editData.estimatedArrivalDate
          ? new Date(editData.estimatedArrivalDate).toISOString()
          : null,
      });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể lưu đợt hàng"));
    }
  }

  async function handleChangeStatus(batch: AdminPurchaseBatch, newStatus: string) {
    if (
      newStatus === "Cancelled" &&
      !confirm(`Hủy đợt hàng "${batch.name}"? Cần tự hoàn cọc cho khách ngoài hệ thống.`)
    ) {
      return;
    }
    setError(null);
    try {
      await updatePurchaseBatchStatus(batch.id, newStatus);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể đổi trạng thái"));
    }
  }

  async function handleDelete(batch: AdminPurchaseBatch) {
    if (!confirm(`Xóa đợt hàng "${batch.name}"?`)) return;
    setError(null);
    try {
      await deletePurchaseBatch(batch.id);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể xóa đợt hàng"));
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8 max-w-5xl">
      <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)] mb-6">
        Quản lý đợt hàng (xách tay)
      </h1>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      {/* Form tạo mới */}
      <section className="mb-8 bg-[var(--brand-cream-dark)] p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Mở đợt hàng mới
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            placeholder="Tên đợt hàng (VD: Đợt hàng Mỹ tháng 8)"
            value={newBatch.name}
            onChange={(e) => setNewBatch((p) => ({ ...p, name: e.target.value }))}
            className={inputClass}
          />
          <input
            placeholder="Quốc gia (không bắt buộc)"
            value={newBatch.countryOfOrigin}
            onChange={(e) => setNewBatch((p) => ({ ...p, countryOfOrigin: e.target.value }))}
            className={inputClass}
          />
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Ngày mở đợt
            </label>
            <input
              type="date"
              value={newBatch.openDate}
              onChange={(e) => setNewBatch((p) => ({ ...p, openDate: e.target.value }))}
              className={`w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Ngày chốt đơn
            </label>
            <input
              type="date"
              value={newBatch.closeDate}
              onChange={(e) => setNewBatch((p) => ({ ...p, closeDate: e.target.value }))}
              className={`w-full ${inputClass}`}
            />
          </div>
          <div>
            <label className="block text-xs text-[var(--brand-text-muted)] mb-1">
              Dự kiến về kho (không bắt buộc)
            </label>
            <input
              type="date"
              value={newBatch.estimatedArrivalDate}
              onChange={(e) =>
                setNewBatch((p) => ({ ...p, estimatedArrivalDate: e.target.value }))
              }
              className={`w-full ${inputClass}`}
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="mt-4 bg-[var(--brand-olive)] text-white px-6 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isCreating ? "Đang tạo..." : "Mở đợt hàng"}
        </button>
      </section>

      {/* Danh sách */}
      <div className="space-y-4">
        {batches.length === 0 ? (
          <p className="text-[var(--brand-text-muted)]">Chưa có đợt hàng nào.</p>
        ) : (
          batches.map((batch) =>
            editingId === batch.id ? (
              <div
                key={batch.id}
                className="bg-[var(--brand-cream-dark)] p-5"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={editData.name}
                    onChange={(e) => setEditData((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    placeholder="Quốc gia"
                    value={editData.countryOfOrigin}
                    onChange={(e) =>
                      setEditData((p) => ({ ...p, countryOfOrigin: e.target.value }))
                    }
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={editData.openDate}
                    onChange={(e) => setEditData((p) => ({ ...p, openDate: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={editData.closeDate}
                    onChange={(e) => setEditData((p) => ({ ...p, closeDate: e.target.value }))}
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={editData.estimatedArrivalDate}
                    onChange={(e) =>
                      setEditData((p) => ({ ...p, estimatedArrivalDate: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div className="flex gap-3 justify-end mt-3">
                  <button
                    onClick={() => handleSaveEdit(batch.id)}
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
              </div>
            ) : (
              <div
                key={batch.id}
                className="bg-[var(--brand-cream-dark)] p-5"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold text-[var(--brand-text)]">
                        {batch.name}
                      </p>
                      <span
                        className={`text-xs font-semibold px-3 py-1 ${
                          STATUS_COLORS[batch.status] ?? ""
                        }`}
                      >
                        {STATUS_LABELS[batch.status] ?? batch.status}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--brand-text-muted)] mt-1">
                      {batch.countryOfOrigin && `${batch.countryOfOrigin} · `}
                      Mở: {new Date(batch.openDate).toLocaleDateString("vi-VN")} · Chốt:{" "}
                      {new Date(batch.closeDate).toLocaleDateString("vi-VN")}
                      {batch.estimatedArrivalDate &&
                        ` · Dự kiến về kho: ${new Date(batch.estimatedArrivalDate).toLocaleDateString("vi-VN")}`}
                    </p>
                    <p className="text-sm text-[var(--brand-text-muted)] mt-1">
                      {batch.productCount} sản phẩm thuộc đợt này
                    </p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => startEdit(batch)}
                      className="text-[var(--brand-text)] text-sm font-medium hover:text-[var(--brand-olive)]"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(batch)}
                      className="text-red-600 text-sm font-medium hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </div>

                {VALID_TRANSITIONS[batch.status]?.length > 0 && (
                  <div className="flex gap-3 mt-4 pt-4 border-t border-[var(--brand-border)]">
                    {VALID_TRANSITIONS[batch.status].map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => handleChangeStatus(batch, nextStatus)}
                        className={`px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-90 ${
                          nextStatus === "Cancelled"
                            ? "border-2 border-red-300 text-red-600"
                            : "bg-[var(--brand-olive)] text-white"
                        }`}
                      >
                        {STATUS_LABELS[nextStatus]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          )
        )}
      </div>
    </main>
  );
}