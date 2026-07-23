"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { getAdminProducts, updateProductStatus } from "@/features/admin/products/api";
import { AdminProductListItem } from "@/types/adminProduct";

const STATUS_LABELS: Record<string, string> = {
  Draft: "Nháp",
  Published: "Đang bán",
  Discontinued: "Ngừng bán",
};

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-[var(--brand-yellow)] text-[var(--brand-olive-dark)]",
  Published: "bg-[var(--brand-green)] text-[var(--brand-olive-dark)]",
  Discontinued: "bg-red-100 text-red-700",
};

export default function AdminProductList() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminProducts();
      setProducts(result.items);
    } catch {
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleStatus(product: AdminProductListItem) {
    const newStatus = product.status === "Published" ? "Discontinued" : "Published";

    setActioningId(product.id);
    setError(null);
    try {
      await updateProductStatus(product.id, newStatus);
      await load();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể cập nhật trạng thái sản phẩm");
      }
    } finally {
      setActioningId(null);
    }
  }

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
          Quản lý sản phẩm
        </h1>
        <Link
          href="/admin/products/new"
          className="bg-[var(--brand-olive)] text-white rounded-full px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          + Thêm sản phẩm
        </Link>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-[var(--brand-border)] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--brand-cream-dark)] text-left">
            <tr>
              <th className="p-3 font-heading text-[var(--brand-text)]">Tên sản phẩm</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Danh mục</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Trạng thái</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Biến thể</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Tồn kho</th>
              <th className="p-3 font-heading text-[var(--brand-text)]">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-[var(--brand-text-muted)]">
                  Chưa có sản phẩm nào
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-t border-[var(--brand-border)]">
                  <td className="p-3">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="font-medium text-[var(--brand-text)] hover:text-[var(--brand-olive)]"
                    >
                      {p.name}
                    </Link>
                    {p.brand && (
                      <p className="text-[var(--brand-text-muted)] text-xs">{p.brand}</p>
                    )}
                  </td>
                  <td className="p-3 text-[var(--brand-text)]">{p.categoryName}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        STATUS_COLORS[p.status] ?? ""
                      }`}
                    >
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="p-3 text-[var(--brand-text)]">{p.variantCount}</td>
                  <td className="p-3 text-[var(--brand-text)]">{p.totalStock}</td>
                  <td className="p-3">
                    {p.status === "Published" ? (
                      <button
                        onClick={() => handleToggleStatus(p)}
                        disabled={actioningId === p.id}
                        className="text-red-600 text-xs font-medium hover:underline disabled:opacity-50"
                      >
                        Ngừng bán
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleStatus(p)}
                        disabled={actioningId === p.id}
                        className="text-[var(--brand-olive)] text-xs font-medium hover:underline disabled:opacity-50"
                      >
                        Xuất bản
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}