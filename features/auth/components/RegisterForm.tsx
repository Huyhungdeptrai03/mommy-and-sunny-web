"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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
    "w-full border border-[var(--brand-border)] rounded-xl px-4 py-2 bg-white focus:outline-none focus:border-[var(--brand-olive)]";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({ email, password, fullName, phoneNumber: phoneNumber || undefined });
      setSuccessMessage("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
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
    <main className="max-w-sm mx-auto px-6 py-16">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[var(--brand-border)] rounded-3xl p-8 space-y-4"
      >
        <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-text)] text-center">
          Đăng ký
        </h1>

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
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
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
          <label className="block text-sm font-medium text-[var(--brand-text)] mb-1">
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
          className="w-full bg-[var(--brand-olive)] text-white rounded-full py-3 font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
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
    </main>
  );
}