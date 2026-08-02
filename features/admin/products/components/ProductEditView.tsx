"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import {
  getAdminProductById,
  updateProduct,
  updateProductStatus,
  addProductImage,
  deleteProductImage,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "@/features/admin/products/api";
import { getCategoryTree } from "@/features/categories/api";
import { formatCurrency } from "@/lib/utils";
import { AdminProductDetail } from "@/types/adminProduct";
import { Category } from "@/types/category";

function flattenCategories(categories: Category[], prefix = ""): { id: string; label: string }[] {
  return categories.flatMap((c) => [
    { id: c.id, label: prefix + c.name },
    ...flattenCategories(c.children, prefix + "— "),
  ]);
}

const STATUS_LABELS: Record<string, string> = {
  Draft: "Nháp",
  Published: "Đang bán",
  Discontinued: "Ngừng bán",
};

function extractErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

export default function ProductEditView() {
  const params = useParams<{ id: string }>();

  const [product, setProduct] = useState<AdminProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [ageMin, setAgeMin] = useState(0);
  const [ageMax, setAgeMax] = useState(12);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);

  const [newVariant, setNewVariant] = useState({
    sku: "",
    size: "",
    color: "",
    price: 0,
    stockQuantity: 0,
    compareAtPrice: "",
    saleEndsAt: "",
  });
  const [isAddingVariant, setIsAddingVariant] = useState(false);

  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editingVariantData, setEditingVariantData] = useState({
    sku: "",
    size: "",
    color: "",
    price: 0,
    stockQuantity: 0,
    compareAtPrice: "",
    saleEndsAt: "",
  });

  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[var(--brand-olive)]";
  const smallInputClass =
    "border border-[var(--brand-border)] rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setIsLoading(true);
    setError(null);
    try {
      const [productData, categoryData] = await Promise.all([
        getAdminProductById(params.id),
        getCategoryTree(),
      ]);
      setProduct(productData);
      setCategories(categoryData);
      setCategoryId(productData.categoryId);
      setName(productData.name);
      setDescription(productData.description ?? "");
      setBrand(productData.brand ?? "");
      setAgeMin(productData.ageRangeMinMonths);
      setAgeMax(productData.ageRangeMaxMonths);
    } catch {
      setError("Không thể tải thông tin sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSavingInfo(true);
    try {
      const updated = await updateProduct(params.id, {
        categoryId,
        name,
        description: description || undefined,
        brand: brand || undefined,
        ageRangeMinMonths: ageMin,
        ageRangeMaxMonths: ageMax,
      });
      setProduct(updated);
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể lưu thông tin sản phẩm"));
    } finally {
      setIsSavingInfo(false);
    }
  }

  async function handleToggleStatus() {
    if (!product) return;
    const newStatus = product.status === "Published" ? "Discontinued" : "Published";

    setIsChangingStatus(true);
    setError(null);
    try {
      await updateProductStatus(params.id, newStatus);
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể đổi trạng thái"));
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleAddImage() {
    if (!newImageUrl.trim()) return;
    setIsAddingImage(true);
    setError(null);
    try {
      await addProductImage(params.id, {
        imageUrl: newImageUrl,
        isPrimary: newImageIsPrimary,
        displayOrder: product?.images.length ?? 0,
      });
      setNewImageUrl("");
      setNewImageIsPrimary(false);
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể thêm ảnh"));
    } finally {
      setIsAddingImage(false);
    }
  }

  async function handleDeleteImage(imageId: string) {
    setError(null);
    try {
      await deleteProductImage(params.id, imageId);
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể xóa ảnh"));
    }
  }

  async function handleAddVariant() {
    if (!newVariant.sku.trim()) {
      setError("SKU không được để trống");
      return;
    }
    setIsAddingVariant(true);
    setError(null);
    try {
      await addProductVariant(params.id, {
        sku: newVariant.sku,
        size: newVariant.size || undefined,
        color: newVariant.color || undefined,
        price: newVariant.price,
        stockQuantity: newVariant.stockQuantity,
        compareAtPrice: newVariant.compareAtPrice ? Number(newVariant.compareAtPrice) : null,
        saleEndsAt: newVariant.saleEndsAt ? new Date(newVariant.saleEndsAt).toISOString() : null,
      });
      setNewVariant({
        sku: "",
        size: "",
        color: "",
        price: 0,
        stockQuantity: 0,
        compareAtPrice: "",
        saleEndsAt: "",
      });
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể thêm biến thể"));
    } finally {
      setIsAddingVariant(false);
    }
  }

  function startEditVariant(variant: AdminProductDetail["variants"][number]) {
    setEditingVariantId(variant.id);
    setEditingVariantData({
      sku: variant.sku,
      size: variant.size ?? "",
      color: variant.color ?? "",
      price: variant.price,
      stockQuantity: variant.stockQuantity,
      compareAtPrice: variant.compareAtPrice ? String(variant.compareAtPrice) : "",
      // datetime-local cần format "YYYY-MM-DDTHH:mm", cắt bớt phần giây/timezone của ISO string
      saleEndsAt: variant.saleEndsAt ? variant.saleEndsAt.slice(0, 16) : "",
    });
  }

  async function handleSaveVariant(variantId: string) {
    setError(null);
    try {
      await updateProductVariant(variantId, {
        sku: editingVariantData.sku,
        size: editingVariantData.size || undefined,
        color: editingVariantData.color || undefined,
        price: editingVariantData.price,
        stockQuantity: editingVariantData.stockQuantity,
        compareAtPrice: editingVariantData.compareAtPrice
          ? Number(editingVariantData.compareAtPrice)
          : null,
        saleEndsAt: editingVariantData.saleEndsAt
          ? new Date(editingVariantData.saleEndsAt).toISOString()
          : null,
      });
      setEditingVariantId(null);
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể lưu biến thể"));
    }
  }

  async function handleDeleteVariant(variantId: string) {
    if (!confirm("Xóa biến thể này?")) return;
    setError(null);
    try {
      await deleteProductVariant(variantId);
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể xóa biến thể"));
    }
  }

  const flatCategories = flattenCategories(categories);

  if (isLoading) {
    return <main className="p-8 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  if (!product) {
    return <main className="p-8 text-red-600">{error ?? "Không tìm thấy sản phẩm"}</main>;
  }

  return (
    <main className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
          Sửa sản phẩm
        </h1>
        <button
          onClick={handleToggleStatus}
          disabled={isChangingStatus}
          className={`text-sm font-semibold px-5 py-2 rounded-full transition-opacity disabled:opacity-50 ${
            product.status === "Published"
              ? "border-2 border-red-300 text-red-600 hover:bg-red-50"
              : "bg-[var(--brand-olive)] text-white hover:opacity-90"
          }`}
        >
          {product.status === "Published" ? "Ngừng bán" : "Xuất bản"}
        </button>
      </div>

      <p className="text-sm text-[var(--brand-text-muted)] mb-6">
        Trạng thái hiện tại:{" "}
        <span className="font-medium text-[var(--brand-text)]">
          {STATUS_LABELS[product.status] ?? product.status}
        </span>
        {" · "}Slug: <span className="font-mono">{product.slug}</span>
      </p>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      {/* ===== Thông tin cơ bản ===== */}
      <section className="mb-8 border border-[var(--brand-border)] bg-white rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Thông tin cơ bản
        </h2>
        <form onSubmit={handleSaveInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
              Danh mục
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={inputClass}
            >
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
            disabled={isSavingInfo}
            className="bg-[var(--brand-olive)] text-white rounded-full px-6 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSavingInfo ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </form>
      </section>

      {/* ===== Ảnh sản phẩm ===== */}
      <section className="mb-8 border border-[var(--brand-border)] bg-white rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Ảnh sản phẩm
        </h2>

        <div className="space-y-2 mb-4">
          {product.images.length === 0 && (
            <p className="text-sm text-[var(--brand-text-muted)]">Chưa có ảnh nào</p>
          )}
          {product.images.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-3 border border-[var(--brand-border)] rounded-xl p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt=""
                className="w-16 h-16 object-cover rounded-lg border border-[var(--brand-border)]"
              />
              <div className="flex-1 text-sm text-[var(--brand-text-muted)] truncate">
                {img.imageUrl}
              </div>
              {img.isPrimary && (
                <span className="text-xs bg-[var(--brand-blue)] text-[var(--brand-olive-dark)] px-3 py-1 rounded-full">
                  Ảnh chính
                </span>
              )}
              <button
                onClick={() => handleDeleteImage(img.id)}
                className="text-red-600 text-sm hover:underline"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="URL ảnh"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            className={`flex-1 ${smallInputClass}`}
          />
          <label className="flex items-center gap-1 text-sm text-[var(--brand-text)] whitespace-nowrap">
            <input
              type="checkbox"
              checked={newImageIsPrimary}
              onChange={(e) => setNewImageIsPrimary(e.target.checked)}
            />
            Ảnh chính
          </label>
          <button
            onClick={handleAddImage}
            disabled={isAddingImage}
            className="bg-[var(--brand-olive)] text-white rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
      </section>

      {/* ===== Biến thể ===== */}
      <section className="mb-8 border border-[var(--brand-border)] bg-white rounded-2xl p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">Biến thể</h2>

        <div className="space-y-2 mb-4">
          {product.variants.length === 0 && (
            <p className="text-sm text-[var(--brand-text-muted)]">Chưa có biến thể nào</p>
          )}
          {product.variants.map((v) =>
            editingVariantId === v.id ? (
              <div
                key={v.id}
                className="border border-[var(--brand-border)] rounded-xl p-3 grid grid-cols-2 md:grid-cols-4 gap-2 items-center"
              >
                <input
                  value={editingVariantData.sku}
                  onChange={(e) => setEditingVariantData((p) => ({ ...p, sku: e.target.value }))}
                  placeholder="SKU"
                  className={smallInputClass}
                />
                <input
                  value={editingVariantData.size}
                  onChange={(e) => setEditingVariantData((p) => ({ ...p, size: e.target.value }))}
                  placeholder="Size"
                  className={smallInputClass}
                />
                <input
                  value={editingVariantData.color}
                  onChange={(e) => setEditingVariantData((p) => ({ ...p, color: e.target.value }))}
                  placeholder="Màu"
                  className={smallInputClass}
                />
                <input
                  type="number"
                  value={editingVariantData.price}
                  onChange={(e) =>
                    setEditingVariantData((p) => ({ ...p, price: Number(e.target.value) }))
                  }
                  placeholder="Giá"
                  className={smallInputClass}
                />
                <input
                  type="number"
                  value={editingVariantData.stockQuantity}
                  onChange={(e) =>
                    setEditingVariantData((p) => ({
                      ...p,
                      stockQuantity: Number(e.target.value),
                    }))
                  }
                  placeholder="Tồn kho"
                  className={smallInputClass}
                />
                <input
                  type="number"
                  value={editingVariantData.compareAtPrice}
                  onChange={(e) =>
                    setEditingVariantData((p) => ({ ...p, compareAtPrice: e.target.value }))
                  }
                  placeholder="Giá gốc (Flash Sale)"
                  className={smallInputClass}
                />
                <input
                  type="datetime-local"
                  value={editingVariantData.saleEndsAt}
                  onChange={(e) =>
                    setEditingVariantData((p) => ({ ...p, saleEndsAt: e.target.value }))
                  }
                  className={smallInputClass}
                />
                <div className="col-span-full flex gap-3 justify-end">
                  <button
                    onClick={() => handleSaveVariant(v.id)}
                    className="text-[var(--brand-olive)] text-sm font-medium hover:underline"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => setEditingVariantId(null)}
                    className="text-[var(--brand-text-muted)] text-sm"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <div
                key={v.id}
                className="flex items-center justify-between border border-[var(--brand-border)] rounded-xl p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--brand-text)] flex items-center gap-2">
                    {v.sku} — {[v.size, v.color].filter(Boolean).join(", ") || "Mặc định"}
                    {v.compareAtPrice && v.saleEndsAt && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                        ⚡ Flash Sale đến {new Date(v.saleEndsAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                  </p>
                  <p className="text-[var(--brand-text-muted)]">
                    {formatCurrency(v.price)}
                    {v.compareAtPrice && (
                      <span className="line-through ml-1">{formatCurrency(v.compareAtPrice)}</span>
                    )}
                    {" · "}Tồn kho {v.stockQuantity} · Đang giữ chỗ{" "}
                    {v.reservedQuantity} · Khả dụng {v.availableQuantity}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => startEditVariant(v)}
                    className="text-[var(--brand-text)] font-medium hover:text-[var(--brand-olive)]"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteVariant(v.id)}
                    className="text-red-600 font-medium hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input
            placeholder="SKU"
            value={newVariant.sku}
            onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))}
            className={smallInputClass}
          />
          <input
            placeholder="Size"
            value={newVariant.size}
            onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
            className={smallInputClass}
          />
          <input
            placeholder="Màu"
            value={newVariant.color}
            onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
            className={smallInputClass}
          />
          <input
            type="number"
            placeholder="Giá"
            value={newVariant.price}
            onChange={(e) => setNewVariant((p) => ({ ...p, price: Number(e.target.value) }))}
            className={smallInputClass}
          />
          <input
            type="number"
            placeholder="Tồn kho"
            value={newVariant.stockQuantity}
            onChange={(e) =>
              setNewVariant((p) => ({ ...p, stockQuantity: Number(e.target.value) }))
            }
            className={smallInputClass}
          />
          <input
            type="number"
            placeholder="Giá gốc (Flash Sale)"
            value={newVariant.compareAtPrice}
            onChange={(e) => setNewVariant((p) => ({ ...p, compareAtPrice: e.target.value }))}
            className={smallInputClass}
          />
          <input
            type="datetime-local"
            value={newVariant.saleEndsAt}
            onChange={(e) => setNewVariant((p) => ({ ...p, saleEndsAt: e.target.value }))}
            className={smallInputClass}
          />
        </div>
        <button
          onClick={handleAddVariant}
          disabled={isAddingVariant}
          className="mt-3 bg-[var(--brand-olive)] text-white rounded-full px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Thêm biến thể
        </button>
      </section>
    </main>
  );
}