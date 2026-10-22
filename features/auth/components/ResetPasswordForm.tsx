"use client";

import { useState, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { resetPassword } from "@/features/auth/api";
import { isValidPassword } from "@/lib/validation";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const inputClass =
    "w-full border border-[var(--brand-border)] px-4 py-2.5 bg-white focus:outline-none focus:border-[var(--brand-text)] transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Thiếu mã đặt lại mật khẩu trong đường dẫn");
      return;
    }

    if (!isValidPassword(newPassword)) {
      setError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ và số");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Không thể đặt lại mật khẩu, vui lòng thử lại");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-[var(--brand-cream)]">
      <div className="w-full max-w-sm bg-white border border-[var(--brand-border)] p-8">
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight text-[var(--brand-text)] mb-2">
          Đặt lại mật khẩu
        </h1>

        {success ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 p-3">
            Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3">
                {error}
              </p>
            )}
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-[var(--brand-text-muted)] mb-1.5">
                Mật khẩu mới
              </label>
              <input
                type="password"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--brand-olive)] text-white py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-[var(--brand-text-muted)] mt-6">
          <Link href="/login" className="text-[var(--brand-text)] font-medium underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
