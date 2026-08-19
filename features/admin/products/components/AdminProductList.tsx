"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import axios from "axios";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { getAdminProducts, updateProductStatus } from "@/features/admin/products/api";
import { AdminProductListItem } from "@/types/adminProduct";

const PAGE_SIZE = 20;

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
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAdminProducts({ page, pageSize: PAGE_SIZE, search: search || undefined });
      setProducts(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(Math.max(1, result.totalPages));
    } catch {
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
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

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="font-heading text-3xl font-extrabold text-[var(--brand-text)]">
          Quản lý sản phẩm
        </h1>
        <div className="flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên sản phẩm..."
              className="border border-[var(--brand-border)] pl-3 pr-9 py-2 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)] w-56"
            />
            <button
              type="submit"
              aria-label="Tìm kiếm"
              className="absolute right-0 top-0 h-full w-9 flex items-center justify-center text-[var(--brand-text-muted)] hover:text-[var(--brand-text)]"
            >
              <Search size={15} />
            </button>
          </form>
          <Link
            href="/admin/products/new"
            className="bg-[var(--brand-olive)] text-white px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + Thêm sản phẩm
          </Link>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className="text-[var(--brand-text-muted)]">Đang tải...</p>
      ) : (
        <>
          <div className="border border-[var(--brand-border)] bg-white overflow-hidden">
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
                      {search ? `Không tìm thấy sản phẩm nào khớp "${search}"` : "Chưa có sản phẩm nào"}
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
                          className={`text-xs font-semibold px-3 py-1 ${
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

          {totalCount > 0 && (
            <div className="flex items-center justify-between mt-4 text-sm text-[var(--brand-text-muted)]">
              <p>
                {totalCount} sản phẩm — Trang {page}/{totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Trang trước"
                  className="w-8 h-8 flex items-center justify-center border border-[var(--brand-border)] text-[var(--brand-text)] hover:border-[var(--brand-text)] disabled:opacity-30 disabled:hover:border-[var(--brand-border)] transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Trang sau"
                  className="w-8 h-8 flex items-center justify-center border border-[var(--brand-border)] text-[var(--brand-text)] hover:border-[var(--brand-text)] disabled:opacity-30 disabled:hover:border-[var(--brand-border)] transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
