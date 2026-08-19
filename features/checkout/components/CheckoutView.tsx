"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getCart } from "@/features/cart/api";
import { getMyAddresses, createAddress } from "@/features/account/api";
import AddressSelector from "./AddressSelector";
import { createOrder } from "@/features/orders/api";
import { applyCoupon } from "@/features/checkout/couponApi";
import { formatCurrency } from "@/lib/utils";
import { Cart } from "@/types/cart";
import { Address } from "@/types/address";

type PaymentMethod = "COD" | "Momo";

export default function CheckoutView() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setItemCount = useCartStore((state) => state.setItemCount);

  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [customerNote, setCustomerNote] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(
    null
  );
  const [couponMessage, setCouponMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{
    orderCode: string;
    totalAmount: number;
    paymentUrl?: string | null;
  } | null>(null);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    recipientName: "",
    phoneNumber: "",
    province: "",
    district: "",
    ward: "",
    detailAddress: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    void loadData();
  }, [isAuthenticated]);

  async function loadData() {
    setIsLoading(true);
    setError(null);
    try {
      const [cartData, addressList] = await Promise.all([getCart(), getMyAddresses()]);
      setCart(cartData);
      setAddresses(addressList);

      const defaultAddress = addressList.find((a) => a.isDefault) ?? addressList[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        setShowAddressForm(true);
      }
    } catch {
      setError("Không thể tải dữ liệu, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateAddress() {
    setError(null);
    try {
      const created = await createAddress({ ...newAddress, isDefault: addresses.length === 0 });
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setShowAddressForm(false);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể tạo địa chỉ, vui lòng thử lại");
      }
    }
  }

  async function handleSubmitOrder() {
    setError(null);

    if (!selectedAddressId) {
      setError("Vui lòng chọn địa chỉ giao hàng");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrder({
        addressId: selectedAddressId,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        customerNote: customerNote || undefined,
      });
      setItemCount(0);

      // Có paymentUrl (chọn thanh toán MoMo và MoMo trả về link hợp lệ) —
      // chuyển hướng NGAY LẬP TỨC sang trang MoMo, không hiện màn hình "thành công" trung gian
      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      setOrderResult(result);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Đã có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApplyCoupon() {
    if (!couponInput.trim()) return;

    setIsApplyingCoupon(true);
    setCouponMessage(null);
    try {
      const result = await applyCoupon(couponInput.trim());
      if (result.isValid) {
        setAppliedCoupon({
          code: couponInput.trim().toUpperCase(),
          discountAmount: result.discountAmount,
        });
        setCouponMessage({ text: result.message ?? "Áp dụng thành công", isError: false });
      } else {
        setAppliedCoupon(null);
        setCouponMessage({ text: result.message ?? "Mã không hợp lệ", isError: true });
      }
    } catch (err) {
      setAppliedCoupon(null);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setCouponMessage({ text: err.response.data.message, isError: true });
      } else {
        setCouponMessage({ text: "Không thể áp dụng mã, vui lòng thử lại", isError: true });
      }
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponMessage(null);
  }

  const inputClass =
    "w-full border border-[var(--brand-border)] px-4 py-2.5 bg-white focus:outline-none focus:border-[var(--brand-text)]";

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Bạn cần đăng nhập để đặt hàng.</p>
      </main>
    );
  }

  if (isLoading) {
    return <main className="max-w-2xl mx-auto px-6 py-16 text-[var(--brand-text-muted)]">Đang tải...</main>;
  }

  if (orderResult) {
    return (
      <main className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 border border-[var(--brand-border)] flex items-center justify-center mx-auto mb-6 text-3xl">
          🎉
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--brand-text)] leading-tight">
          Đặt hàng thành công!
        </h1>
        <p className="mt-4 text-[var(--brand-text-muted)]">
          Mã đơn hàng: <span className="font-semibold text-[var(--brand-text)]">{orderResult.orderCode}</span>
        </p>
        <p className="text-[var(--brand-text-muted)]">
          Tổng tiền:{" "}
          <span className="font-semibold text-[var(--brand-text)]">
            {formatCurrency(orderResult.totalAmount)}
          </span>
        </p>
        {paymentMethod === "Momo" && !orderResult.paymentUrl && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 p-3">
            Đơn hàng đã được tạo, nhưng không thể kết nối tới MoMo lúc này. Vui lòng vào mục
            &ldquo;Đơn hàng&rdquo; để thử thanh toán lại, hoặc liên hệ hỗ trợ.
          </p>
        )}
        <button
          onClick={() => router.push("/")}
          className="mt-10 bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest px-8 py-3.5 hover:bg-black transition-colors"
        >
          Tiếp tục mua sắm
        </button>
      </main>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Giỏ hàng trống, không thể đặt hàng.</p>
      </main>
    );
  }

  const hasPreOrderItems = cart.items.some((item) => item.purchaseBatchName);

  // Nếu giỏ hàng có sản phẩm đặt trước mà đang lỡ chọn Momo (VD: thêm sản phẩm đặt trước
  // vào giỏ SAU KHI đã chọn Momo ở lần trước) — tự động ép về COD, không để khách bấm
  // đặt hàng với lựa chọn không hợp lệ (Backend cũng chặn, đây chỉ là an toàn 2 lớp)
  if (hasPreOrderItems && paymentMethod === "Momo") {
    setPaymentMethod("COD");
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--brand-text)] mb-10">
        Đặt hàng
      </h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 p-3">
          {error}
        </p>
      )}

      <section className="mb-8">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-3">
          Địa chỉ giao hàng
        </h2>

        {addresses.length > 0 && !showAddressForm && (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <label
                key={addr.id}
                className={`flex items-start gap-3 border-2 p-4 cursor-pointer transition-colors ${
                  selectedAddressId === addr.id
                    ? "border-[var(--brand-text)] bg-[var(--brand-cream-dark)]"
                    : "border-[var(--brand-border)] bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={selectedAddressId === addr.id}
                  onChange={() => setSelectedAddressId(addr.id)}
                  className="mt-1"
                />
                <div>
                  <p className="font-medium text-[var(--brand-text)]">
                    {addr.recipientName} — {addr.phoneNumber}
                  </p>
                  <p className="text-sm text-[var(--brand-text-muted)]">
                    {[addr.detailAddress, addr.ward, addr.district, addr.province]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                </div>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setShowAddressForm(true)}
              className="text-sm text-[var(--brand-text)] font-medium underline"
            >
              + Thêm địa chỉ mới
            </button>
          </div>
        )}

        {showAddressForm && (
          <div className="space-y-3 bg-[var(--brand-cream-dark)] p-5">
            <input
              placeholder="Họ tên người nhận"
              value={newAddress.recipientName}
              onChange={(e) => setNewAddress((p) => ({ ...p, recipientName: e.target.value }))}
              className={inputClass}
            />
            <input
              placeholder="Số điện thoại"
              value={newAddress.phoneNumber}
              onChange={(e) => setNewAddress((p) => ({ ...p, phoneNumber: e.target.value }))}
              className={inputClass}
            />
            <AddressSelector
              province={newAddress.province}
              ward={newAddress.ward}
              onProvinceChange={(name) => setNewAddress((p) => ({ ...p, province: name }))}
              onWardChange={(name) => setNewAddress((p) => ({ ...p, ward: name }))}
              inputClass={inputClass}
            />
            <input
              placeholder="Số nhà, tên đường, thôn/xóm (VD: 12 Nguyễn Trãi)"
              value={newAddress.detailAddress}
              onChange={(e) => setNewAddress((p) => ({ ...p, detailAddress: e.target.value }))}
              className={inputClass}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCreateAddress}
                className="bg-[var(--brand-olive)] text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors"
              >
                Lưu địa chỉ
              </button>
              {addresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddressForm(false)}
                  className="text-sm text-[var(--brand-text-muted)]"
                >
                  Hủy
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-3">
          Phương thức thanh toán
        </h2>

        {hasPreOrderItems && (
          <p className="text-sm text-[var(--brand-text-muted)] bg-[var(--brand-cream-dark)] p-3 mb-3">
            Đơn hàng có sản phẩm đặt trước (hàng xách tay) — chỉ hỗ trợ thanh toán COD.
            Tiền cọc và thanh toán còn lại sẽ được shop liên hệ hướng dẫn riêng.
          </p>
        )}

        <div className="space-y-3">
          {(["COD", "Momo"] as PaymentMethod[])
            .filter((method) => method === "COD" || !hasPreOrderItems)
            .map((method) => (
              <label
                key={method}
                className={`flex items-center gap-3 border-2 p-4 cursor-pointer transition-colors ${
                  paymentMethod === method
                    ? "border-[var(--brand-text)] bg-[var(--brand-cream-dark)]"
                    : "border-[var(--brand-border)] bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span className="text-[var(--brand-text)]">
                  {method === "COD" ? "Thanh toán khi nhận hàng (COD)" : "Ví Momo"}
                </span>
              </label>
            ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-3">
          Ghi chú (không bắt buộc)
        </h2>
        <textarea
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          rows={2}
          className={inputClass}
        />
      </section>

      <section className="mb-8">
        <h2 className="font-heading font-semibold text-[var(--brand-text)] mb-3">
          Mã giảm giá
        </h2>
        {appliedCoupon ? (
          <div className="flex items-center justify-between border border-[var(--brand-border)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--brand-text)]">
                {appliedCoupon.code}
              </p>
              <p className="text-xs text-[var(--brand-text-muted)]">
                Giảm {formatCurrency(appliedCoupon.discountAmount)}
              </p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-xs text-red-600 hover:underline"
            >
              Gỡ mã
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              placeholder="Nhập mã giảm giá"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              className={inputClass}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={isApplyingCoupon}
              className="bg-[var(--brand-olive)] text-white px-5 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isApplyingCoupon ? "Đang kiểm tra..." : "Áp dụng"}
            </button>
          </div>
        )}
        {couponMessage && (
          <p className={`text-sm mt-2 ${couponMessage.isError ? "text-red-600" : "text-[var(--brand-text)]"}`}>
            {couponMessage.text}
          </p>
        )}
      </section>

      <section className="mb-8 pt-6">
        <div className="flex items-center justify-between text-sm text-[var(--brand-text-muted)] mb-1">
          <span>Tạm tính</span>
          <span>{formatCurrency(cart.subTotal)}</span>
        </div>
        {appliedCoupon && appliedCoupon.discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm text-red-600 mb-1">
            <span>Giảm giá ({appliedCoupon.code})</span>
            <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-[var(--brand-text-muted)]">Tổng cộng</span>
          <span className="font-heading text-3xl font-extrabold text-[var(--brand-text)]">
            {formatCurrency(Math.max(0, cart.subTotal - (appliedCoupon?.discountAmount ?? 0)))}
          </span>
        </div>
      </section>

      <button
        onClick={handleSubmitOrder}
        disabled={isSubmitting}
        className="w-full bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest py-3.5 hover:bg-black transition-colors disabled:opacity-50"
      >
        {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
      </button>
    </main>
  );
}