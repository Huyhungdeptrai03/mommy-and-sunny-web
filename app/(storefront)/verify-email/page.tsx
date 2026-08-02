import { Suspense } from "react";
import VerifyEmailView from "@/features/auth/components/VerifyEmailView";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center">
          <p className="text-[var(--brand-text-muted)]">Đang tải...</p>
        </main>
      }
    >
      <VerifyEmailView />
    </Suspense>
  );
}