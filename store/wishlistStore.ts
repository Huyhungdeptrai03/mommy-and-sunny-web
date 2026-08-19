import { create } from "zustand";

interface WishlistState {
  productIds: Set<string>;
  setProductIds: (ids: string[]) => void;
  add: (productId: string) => void;
  remove: (productId: string) => void;
}

// KHÔNG persist — giống cartStore, luôn phản ánh đúng dữ liệu mới nhất từ server,
// tránh hiển thị sai icon trái tim nếu user thao tác ở thiết bị/tab khác
export const useWishlistStore = create<WishlistState>((set) => ({
  productIds: new Set(),
  setProductIds: (ids) => set({ productIds: new Set(ids) }),
  add: (productId) =>
    set((state) => ({ productIds: new Set(state.productIds).add(productId) })),
  remove: (productId) =>
    set((state) => {
      const next = new Set(state.productIds);
      next.delete(productId);
      return { productIds: next };
    }),
}));