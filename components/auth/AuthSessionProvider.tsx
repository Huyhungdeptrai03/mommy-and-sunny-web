"use client";

import { Fragment, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { initializeSession, revalidateSession, signOut, SESSION_UNSUPPORTED_MESSAGE } from "@/features/auth/session";

export default function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const { status, generation, notice, retryAt, recoveryRequiresLogin, sessionUnsupported } = useAuthStore();
  const pathname = usePathname();
  useEffect(() => {
    void initializeSession();
    const refresh = () => {
      if (document.visibilityState === "visible") void revalidateSession();
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = window.setInterval(refresh, 60000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setTimeout(() => useAuthStore.setState({ retryAt: null }), Math.max(0, retryAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [retryAt]);
  const sessionNotice = notice && <div role="status" className="border-b border-amber-200 bg-amber-50 p-3 text-center text-sm">
    {notice}{" "}
    {!recoveryRequiresLogin && status !== "anonymous" && <button type="button" disabled={!!retryAt}
      className="underline disabled:opacity-50" onClick={() => void revalidateSession()}>Kiểm tra lại phiên</button>}{" "}
    {recoveryRequiresLogin && <Link className="underline" href="/login">Đăng nhập lại</Link>}{" "}
    <button type="button" className="underline" onClick={() => void signOut().catch(() => undefined)}>Đăng xuất trên máy chủ</button>
  </div>;
  const privatePage = /^\/(?:admin|account|cart|checkout|orders|wishlist)(?:\/|$)/.test(pathname);
  if (sessionUnsupported && privatePage) {
    return <main className="p-12 text-center"><p role="alert">{SESSION_UNSUPPORTED_MESSAGE}</p>
      <Link className="underline" href="/">Tiếp tục xem sản phẩm</Link></main>;
  }
  if (status === "checking" && privatePage) return <>{sessionNotice}<main className="p-12 text-center" aria-busy={!notice}>Đang kiểm tra phiên đăng nhập...</main></>;
  return <>
    {sessionNotice}
    {/* Remount all member-owned component state when identity changes. The callback
        retains its one-time handoff in RAM while the user explicitly signs in. */}
    <Fragment key={["/auth/callback", "/reset-password"].includes(pathname) ? pathname : generation}>{children}</Fragment>
  </>;
}
