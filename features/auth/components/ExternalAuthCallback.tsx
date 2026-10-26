"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authErrorCode, authErrorMessage, captureOAuthCallback, exchangeExternal,
  initializeSession, refreshSession, signIn, submitExternalEmail } from "@/features/auth/session";
import { safeDestination, type OAuthCallback } from "@/features/auth/safety";
import { isValidEmail } from "@/lib/validation";

// React Strict Mode must not consume a one-time handoff twice.
let initialAttempt: Promise<void> | null = null;
let initialFailure: unknown;
let outcome: "link" | "email" | "error" | "done" = "error";

export default function ExternalAuthCallback() {
  const router = useRouter();
  const [stage, setStage] = useState<"checking" | "link" | "email" | "error" | "sent">("checking");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [handoff, setHandoff] = useState<OAuthCallback>({});
  function finish() {
    let destination = "/account";
    try {
      destination = safeDestination(sessionStorage.getItem("member-auth-destination"));
      sessionStorage.removeItem("member-auth-destination");
      sessionStorage.removeItem("member-auth-link-intent");
    } catch { /* fallback is internal */ }
    router.replace(destination);
  }
  useEffect(() => {
    let active = true;
    const data = captureOAuthCallback();
    if (!initialAttempt) {
      initialAttempt = (async () => {
        await initializeSession();
        if (data.error || !data.code) throw new Error("INVALID_HANDOFF");
        let linkIntent = false;
        try { linkIntent = sessionStorage.getItem("member-auth-link-intent") === "true"; } catch { /* no intent */ }
        if (linkIntent) { outcome = "link"; return; }
        await exchangeExternal(data.code, data.emailToken);
        outcome = "done";
      })().catch((error) => {
        initialFailure = error;
        const code = authErrorCode(error);
        outcome = code === "ACCOUNT_LINK_REQUIRED" ? "link"
          : code === "EMAIL_VERIFICATION_REQUIRED" ? "email" : "error";
      });
    }
    void initialAttempt.then(() => {
      if (!active) return;
      setHandoff(data);
      if (outcome === "done") {
        let destination = "/account";
        try {
          destination = safeDestination(sessionStorage.getItem("member-auth-destination"));
          sessionStorage.removeItem("member-auth-destination");
          sessionStorage.removeItem("member-auth-link-intent");
        } catch { /* safe default */ }
        router.replace(destination);
      } else {
        setStage(outcome);
        setMessage(data.error ? "Đăng nhập không hoàn tất hoặc đường dẫn không hợp lệ. Vui lòng bắt đầu lại."
          : initialFailure ? authErrorMessage(initialFailure) : "Đăng nhập lại tài khoản đích và xác nhận liên kết.");
      }
    });
    return () => { active = false; };
  }, [router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy || !handoff.code) return;
    if (!isValidEmail(email) || (stage === "email" && (!fullName.trim() || fullName.trim().length > 150))) {
      setMessage("Vui lòng nhập email hợp lệ và họ tên không quá 150 ký tự.");
      return;
    }
    setBusy(true);
    try {
      if (stage === "link") {
        await signIn(email.trim().toLowerCase(), password);
        setPassword("");
        await exchangeExternal(handoff.code, handoff.emailToken, true);
        finish();
      } else {
        await submitExternalEmail(handoff.code, email.trim().toLowerCase(), fullName.trim());
        setStage("sent");
        setMessage("Hãy mở thư xác minh trên cùng trình duyệt trong vài phút. Nếu hết hạn, bắt đầu đăng nhập lại.");
      }
    } catch (error) {
      setPassword("");
      setMessage(authErrorMessage(error));
      if (["INVALID_HANDOFF", "IDENTITY_CONFLICT", "REFRESH_CONFLICT"].includes(authErrorCode(error) ?? "")) setStage("error");
    } finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-lg px-6 py-16">
    <div className="space-y-5 border border-[var(--brand-border)] bg-white p-8">
      <h1 className="font-heading text-2xl font-bold">Hoàn tất đăng nhập</h1>
      {stage === "checking" ? <p aria-busy="true">Đang xác minh đăng nhập...</p> : <p role="status">{message}</p>}
      {(stage === "link" || stage === "email") && <form onSubmit={handleSubmit} className="space-y-4">
        {stage === "link" && <div className="space-y-2">
          <p className="text-sm">Nếu vừa đăng nhập tài khoản đích trong 5 phút, bạn có thể xác nhận bằng phiên đó. Nếu đã lâu, đăng nhập lại bên dưới hoặc bắt đầu lại từ tài khoản của bạn.</p>
          <button type="button" disabled={busy} className="w-full border p-3 text-sm" onClick={async () => {
            if (!handoff.code || busy) return;
            setBusy(true);
            try {
              await refreshSession();
              await exchangeExternal(handoff.code, handoff.emailToken, true);
              finish();
            } catch (error) { setMessage(authErrorMessage(error)); }
            finally { setBusy(false); }
          }}>Xác nhận liên kết với phiên vừa đăng nhập</button>
        </div>}
        <label className="block text-sm">Email
          <input type="email" required autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border p-3" />
        </label>
        {stage === "email" ? <label className="block text-sm">Họ tên
          <input required maxLength={150} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full border p-3" />
        </label> : <>
          <label className="block text-sm">Mật khẩu tài khoản hiện có
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full border p-3" />
          </label>
          <p className="text-sm">Chỉ xác nhận nếu bạn muốn liên kết danh tính vừa đăng nhập với tài khoản này. Không tự gộp tài khoản theo email.</p>
        </>}
        <button disabled={busy} className="w-full bg-[var(--brand-olive)] p-3 text-white disabled:opacity-50">
          {busy ? "Đang xử lý..." : stage === "link" ? "Đăng nhập và xác nhận liên kết" : "Gửi thư xác minh"}
        </button>
      </form>}
      <Link href="/login" className="block text-sm underline">Bắt đầu đăng nhập lại</Link>
    </div>
  </main>;
}
