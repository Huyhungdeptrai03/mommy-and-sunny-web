"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { getCart } from "@/features/cart/api";
import { getMyAddresses, createAddress } from "@/features/account/api";
import { createOrder } from "@/features/orders/api";
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

  const inputClass =
    "w-full border border-[var(--brand-border)] rounded-xl px-4 py-2 bg-white focus:outline-none focus:border-[var(--brand-olive)]";

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
      <main className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-olive)]">
          Đặt hàng thành công! 🎉
        </h1>
        <p className="mt-3 text-[var(--brand-text)]">
          Mã đơn hàng: <span className="font-semibold">{orderResult.orderCode}</span>
        </p>
        <p className="text-[var(--brand-text)]">
          Tổng tiền: <span className="font-semibold">{formatCurrency(orderResult.totalAmount)}</span>
        </p>
        {paymentMethod === "Momo" && !orderResult.paymentUrl && (
          <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            Đơn hàng đã được tạo, nhưng không thể kết nối tới MoMo lúc này. Vui lòng vào mục
            &ldquo;Đơn hàng&rdquo; để thử thanh toán lại, hoặc liên hệ hỗ trợ.
          </p>
        )}
        <button
          onClick={() => router.push("/")}
          className="mt-8 bg-[var(--brand-olive)] text-white font-semibold px-8 py-3 rounded-full hover:opacity-90 transition-opacity"
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

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] mb-8">
        Đặt hàng
      </h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
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
                className={`flex items-start gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-colors ${
                  selectedAddressId === addr.id
                    ? "border-[var(--brand-olive)] bg-[var(--brand-pink)]/30"
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
                    {addr.detailAddress}, {addr.ward}, {addr.district}, {addr.province}
                  </p>
                </div>
              </label>
            ))}
            <button
              type="button"
              onClick={() => setShowAddressForm(true)}
              className="text-sm text-[var(--brand-olive)] font-medium underline"
            >
              + Thêm địa chỉ mới
            </button>
          </div>
        )}

        {showAddressForm && (
          <div className="space-y-3 rounded-2xl border border-[var(--brand-border)] bg-white p-5">
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
            <div className="grid grid-cols-3 gap-2">
              <input
                placeholder="Tỉnh/Thành"
                value={newAddress.province}
                onChange={(e) => setNewAddress((p) => ({ ...p, province: e.target.value }))}
                className={inputClass}
              />
              <input
                placeholder="Quận/Huyện"
                value={newAddress.district}
                onChange={(e) => setNewAddress((p) => ({ ...p, district: e.target.value }))}
                className={inputClass}
              />
              <input
                placeholder="Phường/Xã"
                value={newAddress.ward}
                onChange={(e) => setNewAddress((p) => ({ ...p, ward: e.target.value }))}
                className={inputClass}
              />
            </div>
            <input
              placeholder="Số nhà, tên đường"
              value={newAddress.detailAddress}
              onChange={(e) => setNewAddress((p) => ({ ...p, detailAddress: e.target.value }))}
              className={inputClass}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCreateAddress}
                className="bg-[var(--brand-olive)] text-white rounded-full px-5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
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
        <div className="space-y-3">
          {(["COD", "Momo"] as PaymentMethod[]).map((method) => (
            <label
              key={method}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 cursor-pointer transition-colors ${
                paymentMethod === method
                  ? "border-[var(--brand-olive)] bg-[var(--brand-pink)]/30"
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

      <section className="mb-8 border-t border-[var(--brand-border)] pt-6">
        <div className="flex items-center justify-between">
          <span className="font-heading text-lg font-bold text-[var(--brand-text)]">
            Tổng cộng
          </span>
          <span className="font-heading text-lg font-extrabold text-[var(--brand-olive)]">
            {formatCurrency(cart.subTotal)}
          </span>
        </div>
      </section>

      <button
        onClick={handleSubmitOrder}
        disabled={isSubmitting}
        className="w-full bg-[var(--brand-olive)] text-white font-semibold py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
      </button>
    </main>
  );
}