"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import {
  MapPin,
  Wallet,
  Truck,
  MessageSquare,
  Tag,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
  PartyPopper,
} from "lucide-react";
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

// Vận chuyển hiện đang miễn phí toàn bộ đơn hàng ở backend (OrderService — MVP) —
// giữ đồng bộ với thông báo ở trang Giỏ hàng, KHÔNG bịa ngưỡng "miễn phí từ X đồng"
const SUMMARY_PERKS = [
  { icon: Truck, text: "Miễn phí vận chuyển toàn bộ đơn hàng" },
  { icon: RotateCcw, text: "Đổi trả trong 7 ngày nếu lỗi từ shop" },
  { icon: ShieldCheck, text: "Thanh toán an toàn, bảo mật" },
];

export default function CheckoutView() {
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
    "w-full border border-[var(--brand-border)] px-4 py-2.5 bg-white focus:outline-none focus:border-[var(--brand-text)] transition-colors";

  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center">
        <p className="text-[var(--brand-text-muted)]">Bạn cần đăng nhập để đặt hàng.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="px-6 md:px-12 py-12 max-w-5xl mx-auto">
        <div className="h-9 w-40 bg-[var(--brand-cream-dark)] animate-pulse mb-10" />
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-24 bg-[var(--brand-cream-dark)] animate-pulse" />
            <div className="h-24 bg-[var(--brand-cream-dark)] animate-pulse" />
          </div>
          <div className="h-72 bg-[var(--brand-cream-dark)] animate-pulse" />
        </div>
      </main>
    );
  }

  if (orderResult) {
    return (
      <main className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 rounded-full border border-[var(--brand-border)] flex items-center justify-center mx-auto mb-6 text-[var(--brand-olive)]">
          <PartyPopper size={26} />
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
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/orders"
            className="border border-[var(--brand-border)] text-[var(--brand-text)] text-xs font-semibold uppercase tracking-widest px-8 py-3.5 hover:border-[var(--brand-text)] transition-colors"
          >
            Xem đơn hàng
          </Link>
          <Link
            href="/"
            className="bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest px-8 py-3.5 hover:bg-black transition-colors"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
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

  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const finalTotal = Math.max(0, cart.subTotal - (appliedCoupon?.discountAmount ?? 0));

  return (
    <main className="px-6 md:px-12 py-12 max-w-5xl mx-auto">
      {/* Breadcrumb — nối liền mạch với trang Giỏ hàng phía trước */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-[var(--brand-text-muted)]">
        <Link href="/" className="hover:text-[var(--brand-text)] transition-colors">
          Trang chủ
        </Link>
        <ChevronRight size={12} />
        <Link href="/cart" className="hover:text-[var(--brand-text)] transition-colors">
          Giỏ hàng
        </Link>
        <ChevronRight size={12} />
        <span className="font-medium text-[var(--brand-text)]">Đặt hàng</span>
      </nav>

      <h1 className="font-heading text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-[var(--brand-text)] mb-10">
        Đặt hàng
      </h1>

      {error && (
        <p className="mb-6 text-sm text-red-600 bg-red-50 border border-red-200 p-3">
          {error}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-10 items-start">
        {/* ===== Cột trái — các bước hoàn tất đơn hàng, đánh số rõ ràng ===== */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="flex items-center gap-2.5 font-heading font-semibold text-[var(--brand-text)] mb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--brand-olive)] text-xs font-bold text-white">
                1
              </span>
              <MapPin size={16} className="text-[var(--brand-text-muted)]" />
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
                        : "border-[var(--brand-border)] bg-white hover:border-[var(--brand-text-muted)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      className="mt-1 accent-[var(--brand-olive)]"
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
                  className="text-sm text-[var(--brand-text)] font-medium underline underline-offset-2"
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

          <section>
            <h2 className="flex items-center gap-2.5 font-heading font-semibold text-[var(--brand-text)] mb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--brand-olive)] text-xs font-bold text-white">
                2
              </span>
              <Wallet size={16} className="text-[var(--brand-text-muted)]" />
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
                        : "border-[var(--brand-border)] bg-white hover:border-[var(--brand-text-muted)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="accent-[var(--brand-olive)]"
                    />
                    {method === "COD" ? (
                      <Truck size={16} className="text-[var(--brand-text-muted)]" />
                    ) : (
                      <Wallet size={16} className="text-[var(--brand-text-muted)]" />
                    )}
                    <span className="text-[var(--brand-text)]">
                      {method === "COD" ? "Thanh toán khi nhận hàng (COD)" : "Ví Momo"}
                    </span>
                  </label>
                ))}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2.5 font-heading font-semibold text-[var(--brand-text)] mb-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-[var(--brand-olive)] text-xs font-bold text-white">
                3
              </span>
              <MessageSquare size={16} className="text-[var(--brand-text-muted)]" />
              Ghi chú (không bắt buộc)
            </h2>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={3}
              placeholder="VD: Giao giờ hành chính, gọi trước khi giao..."
              className={inputClass}
            />
          </section>
        </div>

        {/* ===== Cột phải — tóm tắt đơn hàng: danh sách sản phẩm + mã giảm giá + tổng tiền ===== */}
        <aside className="border border-[var(--brand-border)] bg-white p-6 lg:sticky lg:top-24">
          <h2 className="font-heading text-sm font-bold uppercase tracking-wide text-[var(--brand-text)] mb-5">
            Đơn hàng ({totalQuantity} sản phẩm)
          </h2>

          <div className="max-h-64 overflow-y-auto space-y-4 pr-1 no-scrollbar">
            {cart.items.map((item) => (
              <div key={item.itemId} className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-[var(--brand-cream-dark)]">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-text)] px-1 text-[10px] font-bold text-white">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--brand-text)]">{item.productName}</p>
                  {(item.size || item.color) && (
                    <p className="text-xs text-[var(--brand-text-muted)]">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <p className="shrink-0 text-sm font-semibold text-[var(--brand-text)]">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-[var(--brand-border)] pt-5">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand-text)]">
              <Tag size={13} />
              Mã giảm giá
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between border border-[var(--brand-border)] px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-[var(--brand-text)]">
                    {appliedCoupon.code}
                  </p>
                  <p className="text-xs text-[var(--brand-text-muted)]">
                    Giảm {formatCurrency(appliedCoupon.discountAmount)}
                  </p>
                </div>
                <button onClick={handleRemoveCoupon} className="text-xs text-red-600 hover:underline">
                  Gỡ mã
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  placeholder="Nhập mã"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className={`${inputClass} py-2 text-sm`}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon}
                  className="whitespace-nowrap bg-[var(--brand-olive)] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-black disabled:opacity-50"
                >
                  {isApplyingCoupon ? "..." : "Áp dụng"}
                </button>
              </div>
            )}
            {couponMessage && (
              <p className={`mt-2 text-sm ${couponMessage.isError ? "text-red-600" : "text-[var(--brand-text)]"}`}>
                {couponMessage.text}
              </p>
            )}
          </div>

          <div className="mt-5 space-y-2 border-t border-[var(--brand-border)] pt-5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[var(--brand-text-muted)]">Tạm tính</span>
              <span className="font-medium text-[var(--brand-text)]">{formatCurrency(cart.subTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--brand-text-muted)]">Phí vận chuyển</span>
              <span className="font-medium text-[var(--brand-olive)]">Miễn phí</span>
            </div>
            {appliedCoupon && appliedCoupon.discountAmount > 0 && (
              <div className="flex items-center justify-between text-red-600">
                <span>Giảm giá ({appliedCoupon.code})</span>
                <span>-{formatCurrency(appliedCoupon.discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--brand-border)] pt-4">
            <span className="font-medium text-[var(--brand-text)]">Tổng cộng</span>
            <span className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
              {formatCurrency(finalTotal)}
            </span>
          </div>

          <button
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="mt-6 w-full bg-[var(--brand-olive)] text-white text-xs font-semibold uppercase tracking-widest py-3.5 hover:bg-black transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận đặt hàng"}
          </button>
          <p className="mt-3 text-center text-[11px] text-[var(--brand-text-muted)]">
            Bằng việc đặt hàng, bạn đồng ý với{" "}
            <Link href="/chinh-sach/dieu-khoan" className="underline underline-offset-2 hover:text-[var(--brand-text)]">
              Điều khoản dịch vụ
            </Link>{" "}
            của Crab Be Bé.
          </p>

          <ul className="mt-6 space-y-3 border-t border-[var(--brand-border)] pt-5">
            {SUMMARY_PERKS.map((perk) => (
              <li key={perk.text} className="flex items-center gap-2.5 text-xs text-[var(--brand-text-muted)]">
                <perk.icon size={15} className="shrink-0 text-[var(--brand-text)]" />
                {perk.text}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}
