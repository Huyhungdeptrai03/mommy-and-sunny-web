"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { login } from "@/features/auth/api";
import { authErrorMessage } from "@/features/auth/session";
import { safeDestination } from "@/features/auth/safety";
import SocialLoginButtons from "./SocialLoginButtons";
import { useAuthStore } from "@/store/authStore";
import { isValidEmail } from "@/lib/validation";

export default function LoginForm() {
  const router = useRouter();
  const checking = useAuthStore((state) => state.status === "checking" && !state.notice);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] px-4 py-2.5 bg-white focus:outline-none focus:border-[var(--brand-text)] transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError("Email không hợp lệ");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await login(normalizedEmail, password);
      const returnTo = new URLSearchParams(window.location.search).get("returnTo");
      router.replace(safeDestination(returnTo, result.user.role === "Admin" ? "/admin/dashboard" : "/account"));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(authErrorMessage(err));
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
            Chào mừng
            <br />
            bạn quay lại
          </h2>
          <p className="mt-4 text-white/60 leading-relaxed max-w-xs">
            Đăng nhập để tiếp tục khám phá các sản phẩm nhập khẩu chính hãng cùng Crab
            Bébé.
          </p>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center p-8 md:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            <div className="mb-2">
              <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight text-[var(--brand-text)]">
                Đăng nhập
              </h1>
              <p className="text-sm text-[var(--brand-text-muted)] mt-1">
                Nhập thông tin tài khoản của bạn
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
                {error}
              </p>
            )}

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--brand-text-muted)] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium uppercase tracking-wide text-[var(--brand-text-muted)]">
                  Mật khẩu
                </label>
                <a href="/forgot-password" className="text-xs text-[var(--brand-text)] underline">
                  Quên mật khẩu?
                </a>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || checking}
              className="w-full bg-[var(--brand-olive)] text-white py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <SocialLoginButtons />
            <p className="text-sm text-center text-[var(--brand-text-muted)]">
              Chưa có tài khoản?{" "}
              <a href="/register" className="text-[var(--brand-text)] font-medium underline">
                Đăng ký
              </a>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
