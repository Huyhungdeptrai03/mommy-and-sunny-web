"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { verifyEmail } from "@/features/auth/api";

export default function VerifyEmailView() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("Thiếu mã xác thực trong đường dẫn");
      return;
    }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        if (axios.isAxiosError(err) && err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError("Không thể xác thực email, vui lòng thử lại");
        }
      });
  }, [token]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        {status === "loading" && (
          <p className="text-[var(--brand-text-muted)]">Đang xác thực email...</p>
        )}

        {status === "success" && (
          <>
            <h1 className="font-heading text-2xl font-extrabold text-[var(--brand-olive)]">
              Xác thực thành công! 🎉
            </h1>
            <p className="mt-3 text-[var(--brand-text-muted)]">
              Tài khoản của bạn đã được xác thực. Giờ bạn có thể đặt hàng bình thường.
            </p>
            <Link
              href="/login"
              className="inline-block mt-6 bg-[var(--brand-olive)] text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
              Đăng nhập ngay
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-heading text-2xl font-extrabold text-red-600">
              Xác thực thất bại
            </h1>
            <p className="mt-3 text-[var(--brand-text-muted)]">{error}</p>
            <Link
              href="/"
              className="inline-block mt-6 text-[var(--brand-olive)] font-medium underline"
            >
              Về trang chủ
            </Link>
          </>
        )}
      </div>
    </main>
  );
}