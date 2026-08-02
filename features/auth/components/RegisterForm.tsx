"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Baby, Gift, Star } from "lucide-react";
import { register } from "@/features/auth/api";

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
    "w-full border border-[var(--brand-border)] rounded-xl px-4 py-2.5 bg-white focus:outline-none focus:border-[var(--brand-olive)] transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
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
      {/* Thẻ nổi giữa trang — bo góc lớn, đổ bóng mềm khuếch tán (Soft Material) */}
      <div className="w-full max-w-4xl bg-white rounded-[28px] overflow-hidden grid md:grid-cols-2 shadow-[0_25px_60px_-20px_rgba(58,54,47,0.25)]">
        {/* Panel trái — màu phẳng, không gradient (Flat Design) */}
        <div className="hidden md:flex flex-col justify-center items-center bg-[var(--brand-green)] p-10">
          <div className="flex gap-3 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center rotate-[6deg] shadow-sm">
              <Baby size={24} className="text-[var(--brand-olive)]" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center rotate-[-6deg] mt-4 shadow-sm">
              <Gift size={22} className="text-[var(--brand-olive)]" />
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center rotate-[4deg] shadow-sm">
              <Star size={22} className="text-[var(--brand-olive)]" />
            </div>
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] text-center">
            Tham gia cùng Mommy &amp; Sunny
          </h2>
          <p className="mt-3 text-[var(--brand-text-muted)] text-center max-w-xs">
            Tạo tài khoản để nhận ưu đãi độc quyền và theo dõi đơn hàng dễ dàng.
          </p>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center p-8 md:p-10">
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            <div className="mb-2">
              <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)]">
                Đăng ký
              </h1>
              <p className="text-sm text-[var(--brand-text-muted)] mt-1">
                Tạo tài khoản mới miễn phí
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">
                {successMessage}
              </p>
            )}

            <div>
              <label className="block text-sm font-medium text-[var(--brand-text-muted)] mb-1">
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
              <label className="block text-sm font-medium text-[var(--brand-text-muted)] mb-1">
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
              <label className="block text-sm font-medium text-[var(--brand-text-muted)] mb-1">
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
              <label className="block text-sm font-medium text-[var(--brand-text-muted)] mb-1">
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
              className="w-full bg-[var(--brand-olive)] text-white rounded-full py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_8px_20px_-8px_rgba(91,90,66,0.6)]"
            >
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>

            <p className="text-sm text-center text-[var(--brand-text-muted)]">
              Đã có tài khoản?{" "}
              <a href="/login" className="text-[var(--brand-olive)] font-medium underline">
                Đăng nhập
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}