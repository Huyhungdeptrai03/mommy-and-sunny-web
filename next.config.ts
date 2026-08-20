import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bật View Transitions API (React <ViewTransition>) để chuyển trang mượt mà,
  // không cần thư viện animation ngoài — xem app/layout.tsx
  experimental: {
    viewTransition: true,
  },
};

export default nextConfig;
