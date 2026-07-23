"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { addCartItem } from "@/features/cart/api";
import { formatCurrency } from "@/lib/utils";
import { ProductVariant } from "@/types/product";

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
}

export default function ProductVariantSelector({ variants }: ProductVariantSelectorProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setItemCount = useCartStore((state) => state.setItemCount);

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length === 1 ? variants[0].id : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
  const allOutOfStock = variants.every((v) => v.availableQuantity <= 0);

  async function handleAddToCart() {
    setMessage(null);

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (!selectedVariant) {
      setMessage({ type: "error", text: "Vui lòng chọn 1 phiên bản sản phẩm" });
      return;
    }

    setIsSubmitting(true);
    try {
      const cart = await addCartItem(selectedVariant.id, quantity);
      setItemCount(cart.items.reduce((sum, item) => sum + item.quantity, 0));
      setMessage({ type: "success", text: "Đã thêm vào giỏ hàng" });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setMessage({ type: "error", text: err.response.data.message });
      } else {
        setMessage({ type: "error", text: "Đã có lỗi xảy ra, vui lòng thử lại" });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-3">Chọn phiên bản</h2>
      <div className="space-y-3">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isOutOfStock = variant.availableQuantity <= 0;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => setSelectedVariantId(variant.id)}
              className={`w-full flex items-center justify-between border-2 rounded-2xl p-4 text-left transition-colors ${
                isSelected
                  ? "border-[var(--brand-olive)] bg-[var(--brand-pink)]/30"
                  : "border-[var(--brand-border)]"
              } ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--brand-olive)]"}`}
            >
              <div>
                <p className="font-medium text-[var(--brand-text)]">
                  {[variant.size, variant.color].filter(Boolean).join(" - ") || "Mặc định"}
                </p>
                <p className="text-sm text-[var(--brand-text-muted)]">
                  {isOutOfStock ? "Hết hàng" : `Còn ${variant.availableQuantity} sản phẩm`}
                </p>
              </div>
              <p className="font-bold text-[var(--brand-olive)]">
                {formatCurrency(variant.price)}
              </p>
            </button>
          );
        })}
      </div>

      {selectedVariant && (
        <div className="mt-5 flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--brand-text)]">Số lượng</label>
          <input
            type="number"
            min={1}
            max={selectedVariant.availableQuantity}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="w-20 border border-[var(--brand-border)] rounded-xl px-3 py-2"
          />
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-sm rounded-xl p-3 border ${
            message.type === "success"
              ? "text-green-700 bg-green-50 border-green-200"
              : "text-red-600 bg-red-50 border-red-200"
          }`}
        >
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isSubmitting || allOutOfStock}
        className="mt-5 w-full bg-[var(--brand-olive)] text-white rounded-full py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? "Đang thêm..." : allOutOfStock ? "Hết hàng" : "Thêm vào giỏ"}
      </button>
    </div>
  );
}