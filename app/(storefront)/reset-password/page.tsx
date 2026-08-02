import { Suspense } from "react";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[60vh] flex items-center justify-center">
          <p className="text-[var(--brand-text-muted)]">Đang tải...</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}