"use client";

import { useState } from "react";
import type { ExternalProvider } from "@/types/auth";
import { safeDestination } from "@/features/auth/safety";
import { useAuthStore } from "@/store/authStore";

export default function SocialLoginButtons({ linking = false }: { linking?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const checking = useAuthStore((state) => state.status === "checking" && !state.notice);
  // The API has no provider discovery endpoint. Enable only after operator setup.
  const providers: { id: ExternalProvider; name: string; enabled: boolean }[] = [
    { id: "google", name: "Google", enabled: process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED === "true" },
    { id: "facebook", name: "Facebook", enabled: process.env.NEXT_PUBLIC_FACEBOOK_LOGIN_ENABLED === "true" },
  ];
  function start(provider: ExternalProvider) {
    try {
      const params = new URLSearchParams(window.location.search);
      sessionStorage.setItem("member-auth-destination", safeDestination(params.get("returnTo")));
      sessionStorage.setItem("member-auth-link-intent", linking ? "true" : "false");
      // Top-level same-origin navigation, not fetch or Next Link prefetch.
      window.location.assign(`/api/auth/external/${provider}/start`);
    } catch {
      setError("Không thể bắt đầu đăng nhập. Vui lòng cho phép bộ nhớ phiên của trình duyệt.");
    }
  }
  return <div className="space-y-2">
    {providers.map((provider) => <button key={provider.id} type="button"
      disabled={!provider.enabled || checking} onClick={() => start(provider.id)}
      className="w-full border border-[var(--brand-border)] px-4 py-3 text-sm hover:bg-[var(--brand-cream)] disabled:opacity-50">
      {linking ? "Liên kết" : "Tiếp tục với"} {provider.name}{!provider.enabled && " — chưa khả dụng"}
    </button>)}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
  </div>;
}
