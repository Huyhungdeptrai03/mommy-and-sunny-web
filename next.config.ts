import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return ["/auth/callback", "/verify-email", "/reset-password"].map((source) => ({
      source,
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "no-store, max-age=0" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    }));
  },
  // Bật View Transitions API (React <ViewTransition>) để chuyển trang mượt mà,
  // không cần thư viện animation ngoài — xem app/layout.tsx
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
