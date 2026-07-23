"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { login } from "@/features/auth/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] rounded-xl px-4 py-2 bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      setAuth(result.user, result.accessToken, result.refreshToken);
      router.push("/");
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

  return (
    <main className="max-w-sm mx-auto px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[var(--brand-border)] rounded-3xl p-8 space-y-4"
      >
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] text-center">
          Đăng nhập
        </h1>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </p>
        )}

        <div>
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
            Mật khẩu
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--brand-olive)] text-white rounded-full py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="text-sm text-center text-[var(--brand-text-muted)]">
          Chưa có tài khoản?{" "}
          <a href="/register" className="text-[var(--brand-olive)] font-medium underline">
            Đăng ký
          </a>
        </p>
      </form>
    </main>
  );
}