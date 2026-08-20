"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { register } from "@/features/auth/api";
import { isValidVnPhone } from "@/lib/validation";

export default function RegisterForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] px-4 py-2.5 bg-white focus:outline-none focus:border-[var(--brand-text)] transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (phoneNumber.trim() && !isValidVnPhone(phoneNumber)) {
      setError("Số điện thoại không hợp lệ (VD: 0912345678)");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await register({ email, password, fullName, phoneNumber: phoneNumber || undefined });
      setSuccessMessage(
        "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đặt hàng. Đang chuyển đến trang đăng nhập..."
      );
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        if (data?.errors) {
          const firstFieldErrors = Object.values(data.errors)[0] as string[] | undefined;
          setError(firstFieldErrors?.[0] ?? data.message);
        } else {
          setError(data?.message ?? "Đã có lỗi xảy ra, vui lòng thử lại");
        }
      } else {
        setError("Đã có lỗi xảy ra, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[85vh] flex items-center justify-center px-6 py-12 bg-[var(--brand-cream)]">
      <div className="w-full max-w-4xl bg-white border border-[var(--brand-border)] overflow-hidden grid md:grid-cols-2">
        {/* Panel trái — mực đen, tinh thần boutique cao cấp */}
        <div className="hidden md:flex flex-col justify-center bg-[var(--brand-olive)] text-white p-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.jpg" alt="Crab Be Bé" className="h-20 w-20 rounded-full object-cover" />
          <h2 className="font-heading mt-5 text-3xl font-extrabold uppercase leading-tight">
            Tham gia
            <br />
            cùng chúng tôi
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed max-w-xs">
            Tạo tài khoản để nhận ưu đãi độc quyền và theo dõi đơn hàng dễ dàng.
          </p>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center p-8 md:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            <div className="mb-2">
              <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight text-[var(--brand-text)]">
                Đăng ký
              </h1>
              <p className="text-sm text-[var(--brand-text-muted)] mt-1">
                Tạo tài khoản mới miễn phí
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
                {error}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 p-3">
                {successMessage}
              </p>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--brand-text-muted)] mb-1.5">
                Họ tên
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--brand-text-muted)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--brand-text-muted)] mb-1.5">
                Số điện thoại (không bắt buộc)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--brand-text-muted)] mb-1.5">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--brand-olive)] text-white py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>

            <p className="text-sm text-center text-[var(--brand-text-muted)]">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-[var(--brand-text)] font-medium underline">
                Đăng nhập
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
