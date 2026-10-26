import type { Metadata } from "next";
import ExternalAuthCallback from "@/features/auth/components/ExternalAuthCallback";

export const metadata: Metadata = { title: "Hoàn tất đăng nhập", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

// Outside the storefront layout: no chat widget or third-party address API.
export default function OAuthCallbackPage() { return <ExternalAuthCallback />; }
