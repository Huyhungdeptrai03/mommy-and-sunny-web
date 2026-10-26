"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { forgotPassword } from "@/features/auth/api";
import { isValidEmail } from "@/lib/validation";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "w-full border border-[var(--brand-border)] px-4 py-2.5 bg-white focus:outline-none focus:border-[var(--brand-text)] transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setError("Email không hợp lệ");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await forgotPassword(normalizedEmail);
    } catch {
      // Keep the same public response without leaking account existence or
      // leaving an unhandled rejected promise in the form event handler.
    } finally {
      // Thông báo chung phía UI; hành vi backend cần được xác minh riêng.
      setSubmitted(true);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-12 bg-[var(--brand-cream)]">
      <div className="w-full max-w-sm bg-white border border-[var(--brand-border)] p-8">
        <h1 className="font-heading text-2xl font-extrabold uppercase tracking-tight text-[var(--brand-text)] mb-2">
          Quên mật khẩu
        </h1>

        {submitted ? (
          <p className="text-sm text-[var(--brand-text)] leading-relaxed">
            Nếu email này đã đăng ký, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm
            tra hộp thư (và mục Spam).
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-[var(--brand-text-muted)]">
              Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu.
            </p>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 p-3" aria-live="polite">
                {error}
              </p>
            )}
            <input
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email của bạn"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--brand-olive)] text-white py-3.5 text-xs font-semibold uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
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
