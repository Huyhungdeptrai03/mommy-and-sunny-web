"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import type { ExternalProvider } from "@/types/auth";
import { assertSessionSupported, authErrorMessage } from "@/features/auth/session";
import { safeDestination } from "@/features/auth/safety";
import { useAuthStore } from "@/store/authStore";

export default function SocialLoginButtons({ linking = false, registering = false, disabled = false }: {
  linking?: boolean; registering?: boolean; disabled?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ExternalProvider | null>(null);
  const checking = useAuthStore((state) => state.status === "checking" && !state.notice);
  // The API has no provider discovery endpoint. Enable only after operator setup.
  const providers: { id: ExternalProvider; name: string; enabled: boolean }[] = [
    { id: "google", name: "Google", enabled: process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true" },
    { id: "facebook", name: "Facebook", enabled: process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED === "true" },
  ];
  function start(provider: ExternalProvider) {
    if (disabled || checking || pending || !providers.find((item) => item.id === provider)?.enabled) return;
    setError(null);
    setPending(provider);
    try {
      assertSessionSupported();
      const params = new URLSearchParams(window.location.search);
      sessionStorage.setItem("member-auth-destination", safeDestination(params.get("returnTo")));
      sessionStorage.setItem("member-auth-link-intent", linking ? "true" : "false");
      // Top-level same-origin navigation, not fetch or Next Link prefetch.
      window.location.assign(`/api/auth/external/${provider}/start`);
    } catch (error) {
      setPending(null);
      if (error instanceof Error && error.message === "AUTH_SESSION_UNSUPPORTED") {
        setError(authErrorMessage(error));
        return;
      }
      setError("Không thể bắt đầu đăng nhập. Vui lòng cho phép bộ nhớ phiên của trình duyệt.");
    }
  }
  return <div className="space-y-3">
    {!linking && <div className="flex items-center gap-3 py-1 text-xs text-[var(--brand-text-muted)]">
      <span className="h-px flex-1 bg-[var(--brand-border)]" /><span>Hoặc {registering ? "đăng ký" : "đăng nhập"} với</span><span className="h-px flex-1 bg-[var(--brand-border)]" />
    </div>}
    {providers.map((provider) => <button key={provider.id} type="button"
      disabled={!provider.enabled || checking || disabled || !!pending} onClick={() => start(provider.id)}
      className="relative flex min-h-12 w-full items-center gap-3 border border-[var(--brand-border)] bg-white px-4 py-3 text-sm text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-cream)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-olive)] disabled:cursor-not-allowed disabled:bg-[var(--brand-cream)]">
      {pending === provider.id ? <LoaderCircle size={20} aria-hidden="true" className="shrink-0 animate-spin" /> : provider.id === "google" ?
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"/><path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.97-3.38.97-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.41 13.93a6 6 0 0 1 0-3.86V7.48H3.07a10 10 0 0 0 0 9.04l3.34-2.59Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.51 3.83 1.51l2.87-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.48l3.34 2.59C7.2 7.71 9.4 5.95 12 5.95Z"/></svg> :
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-[#1877F2]"><path d="M24 12a12 12 0 1 0-13.875 11.855V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.313 0 2.686.235 2.686.235v2.953H15.83c-1.49 0-1.955.925-1.955 1.875V12h3.328l-.532 3.47h-2.796v8.385A12 12 0 0 0 24 12Z"/></svg>}
      <span className="min-w-0 flex-1 text-center leading-relaxed">
        {pending === provider.id ? "Đang chuyển đến" : linking ? "Liên kết" : registering ? "Đăng ký với" : "Tiếp tục với"} {provider.name}
        {!provider.enabled && <span className="block text-xs text-[var(--brand-text-muted)]">Chưa khả dụng</span>}
      </span>
      <span className="w-5 shrink-0" aria-hidden="true" />
    </button>)}
    {providers.some((provider) => !provider.enabled) && <p className="text-center text-xs leading-relaxed text-[var(--brand-text-muted)]">Phương thức chưa khả dụng đang được thiết lập. Bạn có thể {registering ? "đăng ký" : "đăng nhập"} bằng email.</p>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}
