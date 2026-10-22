"use client";

import { useRef, useState } from "react";
import axios from "axios";
import { X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { createPersonalImportRequest, uploadPersonalImportImage } from "@/features/personal-import/api";
import { isValidEmail, isValidFullName, isValidUrl, isValidVnPhone } from "@/lib/validation";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export default function PersonalImportRequestForm() {
  const user = useAuthStore((state) => state.user);

  const [productName, setProductName] = useState("");
  const [productLink, setProductLink] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [customerName, setCustomerName] = useState(user?.fullName ?? "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState(user?.email ?? "");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-[var(--brand-text)] transition-colors";

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageError("Kích thước ảnh tối đa 5MB");
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setImageError("Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc GIF");
      return;
    }

    setImageError(null);
    setImagePreview(URL.createObjectURL(file));
    setIsUploadingImage(true);
    try {
      const url = await uploadPersonalImportImage(file);
      setImageUrl(url);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setImageError(err.response.data.message);
      } else {
        setImageError("Không thể tải ảnh lên, vui lòng thử lại");
      }
      setImagePreview(null);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function handleRemoveImage() {
    setImageUrl(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || !customerName.trim() || !customerPhone.trim()) {
      setError("Vui lòng nhập tên sản phẩm, tên và số điện thoại liên hệ");
      return;
    }
    if (!isValidFullName(customerName)) {
      setError("Họ tên phải có từ 2 đến 100 ký tự và không chứa số hoặc ký tự đặc biệt");
      return;
    }
    if (!isValidVnPhone(customerPhone)) {
      setError("Số điện thoại không hợp lệ (VD: 0912345678)");
      return;
    }
    if (customerEmail.trim() && !isValidEmail(customerEmail)) {
      setError("Email không hợp lệ");
      return;
    }
    if (productLink.trim() && !isValidUrl(productLink)) {
      setError("Link sản phẩm không hợp lệ");
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      setError("Số lượng phải là số nguyên từ 1 đến 99");
      return;
    }
    if (productName.trim().length > 200 || customerName.trim().length > 100) {
      setError("Tên sản phẩm tối đa 200 ký tự và họ tên tối đa 100 ký tự");
      return;
    }
    if (notes.trim().length > 2000) {
      setError("Ghi chú tối đa 2000 ký tự");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await createPersonalImportRequest({
        productName: productName.trim(),
        productLink: productLink.trim() || undefined,
        quantity,
        notes: notes.trim() || undefined,
        imageUrl: imageUrl ?? undefined,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
      });
      setSuccess(true);
      setProductName("");
      setProductLink("");
      setQuantity(1);
      setNotes("");
      setCustomerPhone("");
      handleRemoveImage();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể gửi yêu cầu, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="border border-[var(--brand-border)] bg-white p-8 text-center">
        <p className="font-heading text-xl font-bold text-[var(--brand-text)] mb-2">
          Đã gửi yêu cầu thành công!
        </p>
        <p className="text-sm text-[var(--brand-text-muted)]">
          Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để báo giá và xác nhận chi tiết.
        </p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 text-sm font-semibold uppercase tracking-widest text-[var(--brand-text)] hover:text-[var(--brand-olive)]"
        >
          Gửi thêm yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[var(--brand-border)] bg-white p-6 md:p-8 space-y-4">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
          Tên sản phẩm muốn đặt <span className="text-red-600">*</span>
        </label>
        <input
          value={productName}
          required
          maxLength={200}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="VD: Sữa tắm Bübchen 400ml"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
          Link sản phẩm (nếu có)
        </label>
        <input
          value={productLink}
          type="url"
          maxLength={2048}
          onChange={(e) => setProductLink(e.target.value)}
          placeholder="Dán link sản phẩm từ shop nước ngoài..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
          Số lượng
        </label>
        <input
          type="number"
          min={1}
          max={99}
          step={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
          Ghi chú
        </label>
        <textarea
          value={notes}
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Màu sắc, dung tích, thời gian mong muốn nhận hàng..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
          Ảnh sản phẩm (không bắt buộc)
        </label>
        {imagePreview ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Ảnh sản phẩm"
              className="h-28 w-28 object-cover border border-[var(--brand-border)]"
            />
            {isUploadingImage && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-[10px] font-semibold uppercase text-[var(--brand-text)]">
                Đang tải...
              </div>
            )}
            <button
              type="button"
              onClick={handleRemoveImage}
              aria-label="Xóa ảnh"
              className="absolute -top-2 -right-2 w-5 h-5 bg-[var(--brand-text)] text-white flex items-center justify-center"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageSelect}
            className="block w-full text-sm text-[var(--brand-text-muted)] file:mr-4 file:border-0 file:bg-[var(--brand-cream-dark)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-[var(--brand-text)]"
          />
        )}
        {imageError && <p className="text-sm text-red-600 mt-2">{imageError}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--brand-border)]">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
            Họ tên <span className="text-red-600">*</span>
          </label>
          <input
            value={customerName}
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            onChange={(e) => setCustomerName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
            Số điện thoại <span className="text-red-600">*</span>
          </label>
          <input
            type="tel"
            required
            minLength={10}
            maxLength={10}
            pattern="0[0-9]{9}"
            title="Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0"
            inputMode="numeric"
            autoComplete="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="VD: 0912345678"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)] mb-1.5">
          Email (không bắt buộc)
        </label>
        <input
          type="email"
          maxLength={254}
          autoComplete="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || isUploadingImage}
        className="w-full bg-[var(--brand-olive)] text-white px-6 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
      </button>
    </form>
  );
}
