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
  addProductSpecification,
  deleteProductSpecification,
  addProductVariant,
  updateProductVariant,
  deleteProductVariant,
} from "@/features/admin/products/api";
import { getCategoryTree } from "@/features/categories/api";
import { getAdminPurchaseBatches } from "@/features/admin/purchase-batches/api";
import { formatCurrency } from "@/lib/utils";
import { isValidUrl } from "@/lib/validation";
import { AdminProductDetail } from "@/types/adminProduct";
import { AdminPurchaseBatch } from "@/types/adminPurchaseBatch";
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
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [purchaseBatches, setPurchaseBatches] = useState<AdminPurchaseBatch[]>([]);
  const [purchaseBatchId, setPurchaseBatchId] = useState("");
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);
  const [isAddingImage, setIsAddingImage] = useState(false);

  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [isAddingSpec, setIsAddingSpec] = useState(false);

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
    "w-full border border-[var(--brand-border)] px-3 py-2 bg-white focus:outline-none focus:border-[var(--brand-olive)]";
  const smallInputClass =
    "border border-[var(--brand-border)] px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAll() {
    setIsLoading(true);
    setError(null);
    try {
      const [productData, categoryData, batchData] = await Promise.all([
        getAdminProductById(params.id),
        getCategoryTree(),
        getAdminPurchaseBatches().catch(() => []),
      ]);
      setProduct(productData);
      setCategories(categoryData);
      setPurchaseBatches(batchData);
      setCategoryId(productData.categoryId);
      setName(productData.name);
      setDescription(productData.description ?? "");
      setBrand(productData.brand ?? "");
      setAgeMin(productData.ageRangeMinMonths?.toString() ?? "");
      setAgeMax(productData.ageRangeMaxMonths?.toString() ?? "");
      setPurchaseBatchId(productData.purchaseBatchId ?? "");
    } catch {
      setError("Không thể tải thông tin sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Vui lòng nhập tên sản phẩm");
      return;
    }
    if (ageMin && ageMax && Number(ageMin) > Number(ageMax)) {
      setError("Độ tuổi tối thiểu không được lớn hơn độ tuổi tối đa");
      return;
    }
    setError(null);
    setIsSavingInfo(true);
    try {
      const updated = await updateProduct(params.id, {
        categoryId,
        name,
        description: description || undefined,
        brand: brand || undefined,
        ageRangeMinMonths: ageMin ? Number(ageMin) : undefined,
        ageRangeMaxMonths: ageMax ? Number(ageMax) : undefined,
        purchaseBatchId: purchaseBatchId || null,
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
    if (!isValidUrl(newImageUrl)) {
      setError("URL ảnh không hợp lệ");
      return;
    }
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

  async function handleAddSpecification() {
    if (!newSpecLabel.trim() || !newSpecValue.trim()) {
      setError("Vui lòng nhập đủ nhãn và giá trị thông số");
      return;
    }
    setIsAddingSpec(true);
    setError(null);
    try {
      await addProductSpecification(params.id, {
        label: newSpecLabel.trim(),
        value: newSpecValue.trim(),
        displayOrder: product?.specifications.length ?? 0,
      });
      setNewSpecLabel("");
      setNewSpecValue("");
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể thêm thông số"));
    } finally {
      setIsAddingSpec(false);
    }
  }

  async function handleDeleteSpecification(specificationId: string) {
    setError(null);
    try {
      await deleteProductSpecification(params.id, specificationId);
      await loadAll();
    } catch (err) {
      setError(extractErrorMessage(err, "Không thể xóa thông số"));
    }
  }

  // Dùng chung cho cả thêm mới và sửa biến thể
  function validateVariant(sku: string, price: number, stockQuantity: number, compareAtPrice: string): string | null {
    if (!sku.trim()) return "SKU không được để trống";
    if (price <= 0) return "Giá bán phải lớn hơn 0";
    if (stockQuantity < 0) return "Tồn kho không được âm";
    if (compareAtPrice && Number(compareAtPrice) <= price) {
      return "Giá gốc (trước giảm) phải lớn hơn giá bán";
    }
    return null;
  }

  async function handleAddVariant() {
    const validationError = validateVariant(
      newVariant.sku,
      newVariant.price,
      newVariant.stockQuantity,
      newVariant.compareAtPrice
    );
    if (validationError) {
      setError(validationError);
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
    const validationError = validateVariant(
      editingVariantData.sku,
      editingVariantData.price,
      editingVariantData.stockQuantity,
      editingVariantData.compareAtPrice
    );
    if (validationError) {
      setError(validationError);
      return;
    }
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
    <main className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
          Sửa sản phẩm
        </h1>
        <button
          onClick={handleToggleStatus}
          disabled={isChangingStatus}
          className={`text-sm font-semibold px-5 py-2 transition-opacity disabled:opacity-50 ${
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
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      {/* ===== Thông tin cơ bản ===== */}
      <section className="mb-8 border border-[var(--brand-border)] bg-white p-6">
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
                Độ tuổi từ (tháng) — không bắt buộc
              </label>
              <input
                type="number"
                min={0}
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
                {purchaseBatches
                  .filter((b) => b.status === "Open" || b.id === purchaseBatchId)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                      {b.countryOfOrigin ? ` (${b.countryOfOrigin})` : ""}
                      {b.status !== "Open" ? " — đã đóng, không đổi được" : ""}
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
            disabled={isSavingInfo}
            className="bg-[var(--brand-olive)] text-white px-6 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSavingInfo ? "Đang lưu..." : "Lưu thông tin"}
          </button>
        </form>
      </section>

      {/* ===== Ảnh sản phẩm ===== */}
      <section className="mb-8 border border-[var(--brand-border)] bg-white p-6">
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
              className="flex items-center gap-3 border border-[var(--brand-border)] p-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.imageUrl}
                alt=""
                className="w-16 h-16 object-cover border border-[var(--brand-border)]"
              />
              <div className="flex-1 text-sm text-[var(--brand-text-muted)] truncate">
                {img.imageUrl}
              </div>
              {img.isPrimary && (
                <span className="text-xs bg-[var(--brand-blue)] text-[var(--brand-olive-dark)] px-3 py-1">
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
            className="bg-[var(--brand-olive)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
      </section>

      {/* ===== Thông số sản phẩm (xuất xứ, chất liệu...) ===== */}
      <section className="mb-8 border border-[var(--brand-border)] bg-white p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">
          Thông số sản phẩm
        </h2>

        <div className="space-y-2 mb-4">
          {product.specifications.length === 0 && (
            <p className="text-sm text-[var(--brand-text-muted)]">
              Chưa có thông số nào (VD: Xuất xứ, Chất liệu, Dung tích...)
            </p>
          )}
          {product.specifications.map((spec) => (
            <div
              key={spec.id}
              className="flex items-center gap-3 border border-[var(--brand-border)] p-2"
            >
              <p className="flex-1 text-sm text-[var(--brand-text)]">
                <span className="font-medium">{spec.label}</span>
                <span className="text-[var(--brand-text-muted)]"> — {spec.value}</span>
              </p>
              <button
                onClick={() => handleDeleteSpecification(spec.id)}
                className="text-red-600 text-sm hover:underline"
              >
                Xóa
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            placeholder="Nhãn (VD: Xuất xứ)"
            value={newSpecLabel}
            onChange={(e) => setNewSpecLabel(e.target.value)}
            className={`w-40 ${smallInputClass}`}
          />
          <input
            placeholder="Giá trị (VD: Việt Nam)"
            value={newSpecValue}
            onChange={(e) => setNewSpecValue(e.target.value)}
            className={`flex-1 ${smallInputClass}`}
          />
          <button
            onClick={handleAddSpecification}
            disabled={isAddingSpec}
            className="bg-[var(--brand-olive)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Thêm
          </button>
        </div>
      </section>

      {/* ===== Biến thể ===== */}
      <section className="mb-8 border border-[var(--brand-border)] bg-white p-6">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-4">Biến thể</h2>

        <div className="space-y-2 mb-4">
          {product.variants.length === 0 && (
            <p className="text-sm text-[var(--brand-text-muted)]">Chưa có biến thể nào</p>
          )}
          {product.variants.map((v) =>
            editingVariantId === v.id ? (
              <div
                key={v.id}
                className="border border-[var(--brand-border)] p-3 grid grid-cols-2 md:grid-cols-4 gap-3 items-start"
              >
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
                    SKU (mã sản phẩm)
                  </label>
                  <input
                    value={editingVariantData.sku}
                    onChange={(e) => setEditingVariantData((p) => ({ ...p, sku: e.target.value }))}
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
                    Phân loại 1
                  </label>
                  <input
                    value={editingVariantData.size}
                    onChange={(e) => setEditingVariantData((p) => ({ ...p, size: e.target.value }))}
                    placeholder="VD: Size M"
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
                    Phân loại 2
                  </label>
                  <input
                    value={editingVariantData.color}
                    onChange={(e) => setEditingVariantData((p) => ({ ...p, color: e.target.value }))}
                    placeholder="VD: Màu xanh"
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
                    Giá bán (đ)
                  </label>
                  <input
                    type="number"
                    value={editingVariantData.price}
                    onChange={(e) =>
                      setEditingVariantData((p) => ({ ...p, price: Number(e.target.value) }))
                    }
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    value={editingVariantData.stockQuantity}
                    onChange={(e) =>
                      setEditingVariantData((p) => ({
                        ...p,
                        stockQuantity: Number(e.target.value),
                      }))
                    }
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
                    Giá gốc (Flash Sale)
                  </label>
                  <input
                    type="number"
                    value={editingVariantData.compareAtPrice}
                    onChange={(e) =>
                      setEditingVariantData((p) => ({ ...p, compareAtPrice: e.target.value }))
                    }
                    placeholder="Không giảm giá"
                    className={smallInputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
                    Hết giảm giá lúc
                  </label>
                  <input
                    type="datetime-local"
                    value={editingVariantData.saleEndsAt}
                    onChange={(e) =>
                      setEditingVariantData((p) => ({ ...p, saleEndsAt: e.target.value }))
                    }
                    className={smallInputClass}
                  />
                </div>
                <div className="col-span-full flex gap-3 justify-end pt-1">
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
                className="flex items-center justify-between border border-[var(--brand-border)] p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--brand-text)] flex items-center gap-2">
                    {v.sku} — {[v.size, v.color].filter(Boolean).join(", ") || "Mặc định"}
                    {v.compareAtPrice && v.saleEndsAt && (
                      <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5">
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
              SKU (mã sản phẩm) *
            </label>
            <input
              placeholder="VD: AB12345"
              value={newVariant.sku}
              onChange={(e) => setNewVariant((p) => ({ ...p, sku: e.target.value }))}
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
              Phân loại 1 — không bắt buộc
            </label>
            <input
              placeholder="VD: Size M"
              value={newVariant.size}
              onChange={(e) => setNewVariant((p) => ({ ...p, size: e.target.value }))}
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
              Phân loại 2 — không bắt buộc
            </label>
            <input
              placeholder="VD: Màu xanh"
              value={newVariant.color}
              onChange={(e) => setNewVariant((p) => ({ ...p, color: e.target.value }))}
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
              Giá bán (đ) *
            </label>
            <input
              type="number"
              placeholder="VD: 150000"
              value={newVariant.price}
              onChange={(e) => setNewVariant((p) => ({ ...p, price: Number(e.target.value) }))}
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
              Tồn kho (số lượng) *
            </label>
            <input
              type="number"
              placeholder="VD: 100"
              value={newVariant.stockQuantity}
              onChange={(e) =>
                setNewVariant((p) => ({ ...p, stockQuantity: Number(e.target.value) }))
              }
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
              Giá gốc trước giảm — chỉ điền nếu chạy Flash Sale
            </label>
            <input
              type="number"
              placeholder="Không giảm giá"
              value={newVariant.compareAtPrice}
              onChange={(e) => setNewVariant((p) => ({ ...p, compareAtPrice: e.target.value }))}
              className={smallInputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--brand-text-muted)] mb-1">
              Thời điểm hết giảm giá — đi kèm ô trên
            </label>
            <input
              type="datetime-local"
              value={newVariant.saleEndsAt}
              onChange={(e) => setNewVariant((p) => ({ ...p, saleEndsAt: e.target.value }))}
              className={smallInputClass}
            />
          </div>
        </div>
        <button
          onClick={handleAddVariant}
          disabled={isAddingVariant}
          className="mt-3 bg-[var(--brand-olive)] text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          Thêm biến thể
        </button>
      </section>
    </main>
  );
}