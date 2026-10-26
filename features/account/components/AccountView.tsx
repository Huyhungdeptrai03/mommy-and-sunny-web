"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { createAddress, getMyAddresses, getProfile, updateProfile } from "@/features/account/api";
import { resendVerification } from "@/features/auth/api";
import { authErrorMessage, signOut } from "@/features/auth/session";
import SocialLoginButtons from "@/features/auth/components/SocialLoginButtons";
import OrderList from "@/features/orders/components/OrderList";
import AddressSelector from "@/features/checkout/components/AddressSelector";
import type { Address } from "@/types/address";
import { isValidFullName, isValidVnPhone } from "@/lib/validation";

export default function AccountView() {
  const { user, status } = useAuthStore();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phoneNumber ?? "");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [address, setAddress] = useState({ recipientName: "", phoneNumber: "", province: "", district: "", ward: "", detailAddress: "" });
  const inputClass = "mt-1 w-full border border-[var(--brand-border)] bg-white p-3";
  useEffect(() => {
    let active = true;
    if (status !== "authenticated") return;
    void Promise.all([getProfile(), getMyAddresses()]).then(([profile, saved]) => {
      if (!active) return;
      setFullName(profile.fullName);
      setPhone(profile.phoneNumber ?? "");
      setAddresses(saved);
      useAuthStore.setState({ user: profile });
    }).catch((error) => { if (active) setMessage(authErrorMessage(error)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status]);
  if (status === "checking") return <main className="p-12 text-center">Đang kiểm tra phiên...</main>;
  if (!user) return <main className="p-12 text-center">Bạn cần đăng nhập để xem tài khoản. <Link className="underline" href="/login?returnTo=/account">Đăng nhập</Link></main>;

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!fullName.trim() || fullName.trim().length > 150 || (phone.trim() && !/^0\d{9,10}$/.test(phone.trim()))) {
      setMessage("Họ tên tối đa 150 ký tự; số điện thoại bắt đầu 0 và có 10–11 chữ số."); return;
    }
    setBusy(true); setMessage("");
    try {
      const profile = await updateProfile({ fullName: fullName.trim(), phoneNumber: phone.trim() || null });
      useAuthStore.setState({ user: profile });
      setMessage("Đã cập nhật hồ sơ.");
    } catch (error) { setMessage(authErrorMessage(error)); }
    finally { setBusy(false); }
  }
  async function saveAddress(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!isValidFullName(address.recipientName) || !isValidVnPhone(address.phoneNumber) ||
        !address.province.trim() || !address.ward.trim() || !address.detailAddress.trim()) {
      setMessage("Vui lòng kiểm tra họ tên, số điện thoại và địa chỉ giao hàng."); return;
    }
    setBusy(true); setMessage("");
    try {
      const saved = await createAddress({ ...address, isDefault: addresses.length === 0 });
      setAddresses((items) => [...items, saved]);
      setAddress({ recipientName: "", phoneNumber: "", province: "", district: "", ward: "", detailAddress: "" });
      setMessage("Đã lưu địa chỉ.");
    } catch (error) { setMessage(authErrorMessage(error)); }
    finally { setBusy(false); }
  }
  return <>
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-3xl font-extrabold uppercase">Tài khoản của tôi</h1>
        <button className="text-sm underline" onClick={() => void signOut().catch(() => undefined)}>Đăng xuất</button>
      </div>
      {message && <p role="status" className="border p-3 text-sm">{message}</p>}
      {loading && <p aria-busy="true">Đang tải hồ sơ và địa chỉ...</p>}
      <section className="space-y-4 border border-[var(--brand-border)] bg-white p-6">
        <h2 className="font-heading text-xl font-bold">Thông tin thành viên</h2>
        <p>{user.email} — {user.emailVerified ? "Đã xác minh" : "Chưa xác minh email"}</p>
        {!user.emailVerified && <button disabled={busy} className="text-sm underline" onClick={async () => {
          setBusy(true);
          try { await resendVerification(user.email); setMessage("Nếu phù hợp, thư xác minh đã được gửi. Vui lòng kiểm tra hộp thư."); }
          catch (error) { setMessage(authErrorMessage(error)); }
          finally { setBusy(false); }
        }}>Gửi lại thư xác minh</button>}
        <form onSubmit={saveProfile} className="space-y-4">
          <label className="block text-sm">Họ tên<input required maxLength={150} autoComplete="name" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
          <label className="block text-sm">Số điện thoại<input type="tel" maxLength={11} autoComplete="tel" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
          <button disabled={busy} className="bg-[var(--brand-olive)] px-6 py-3 text-sm text-white disabled:opacity-50">Lưu hồ sơ</button>
        </form>
      </section>
      <section className="space-y-4 border border-[var(--brand-border)] bg-white p-6">
        <h2 className="font-heading text-xl font-bold">Địa chỉ đã lưu</h2>
        {!loading && addresses.length === 0 && <p className="text-sm">Bạn chưa có địa chỉ giao hàng.</p>}
        {addresses.map((item) => <div className="border-b pb-3 text-sm" key={item.id}>
          <p className="font-semibold">{item.recipientName} — {item.phoneNumber}{item.isDefault ? " · Mặc định" : ""}</p>
          <p>{[item.detailAddress, item.ward, item.district, item.province].filter(Boolean).join(", ")}</p>
        </div>)}
        <form onSubmit={saveAddress} className="space-y-3">
          <h3 className="font-semibold">Thêm địa chỉ</h3>
          <label className="block text-sm">Người nhận<input required maxLength={100} className={inputClass} value={address.recipientName} onChange={(e) => setAddress({ ...address, recipientName: e.target.value })} /></label>
          <label className="block text-sm">Điện thoại<input required type="tel" maxLength={10} className={inputClass} value={address.phoneNumber} onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })} /></label>
          <AddressSelector province={address.province} ward={address.ward} inputClass={inputClass}
            onProvinceChange={(province) => setAddress((value) => ({ ...value, province }))}
            onWardChange={(ward) => setAddress((value) => ({ ...value, ward }))} />
          <label className="block text-sm">Địa chỉ chi tiết<input required maxLength={500} className={inputClass} value={address.detailAddress} onChange={(e) => setAddress({ ...address, detailAddress: e.target.value })} /></label>
          <button disabled={busy || loading} className="bg-[var(--brand-olive)] px-6 py-3 text-sm text-white disabled:opacity-50">Lưu địa chỉ</button>
        </form>
      </section>
      <section className="space-y-3 border border-[var(--brand-border)] bg-white p-6">
        <h2 className="font-heading text-xl font-bold">Liên kết đăng nhập</h2>
        <p className="text-sm">Bạn sẽ cần đăng nhập lại tài khoản này để xác nhận liên kết. Hiện chưa hỗ trợ gỡ liên kết hoặc xem danh sách provider đã liên kết.</p>
        <SocialLoginButtons linking />
      </section>
      <Link href="/orders" className="block underline">Xem tất cả đơn hàng</Link>
    </main>
    <OrderList />
  </>;
}
