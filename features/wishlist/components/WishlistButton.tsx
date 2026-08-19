"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { addToWishlist, removeFromWishlist } from "@/features/wishlist/api";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: number;
}

export default function WishlistButton({
  productId,
  className = "",
  size = 18,
}: WishlistButtonProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isWishlisted = useWishlistStore((s) => s.productIds.has(productId));
  const add = useWishlistStore((s) => s.add);
  const remove = useWishlistStore((s) => s.remove);

  async function handleClick(e: React.MouseEvent) {
    // ProductCard bọc trong <Link> — chặn không cho click lan ra ngoài làm điều hướng
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Cập nhật giao diện NGAY (optimistic), tự rollback nếu gọi API thất bại —
    // cảm giác phản hồi tức thì, đúng tinh thần "Friendly" của phong cách thiết kế
    if (isWishlisted) {
      remove(productId);
      try {
        await removeFromWishlist(productId);
      } catch {
        add(productId);
      }
    } else {
      add(productId);
      try {
        await addToWishlist(productId);
      } catch {
        remove(productId);
      }
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center transition-colors ${className}`}
      aria-label={isWishlisted ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      <Heart
        size={size}
        className={isWishlisted ? "text-red-500" : "text-[var(--brand-text-muted)]"}
        fill={isWishlisted ? "currentColor" : "none"}
      />
    </button>
  );
}