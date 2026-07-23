import { create } from "zustand";

interface CartState {
  itemCount: number;
  setItemCount: (count: number) => void;
}

// KHÔNG dùng persist ở đây — số lượng giỏ hàng nên luôn phản ánh đúng dữ liệu
// mới nhất từ server (tránh hiển thị sai nếu user sửa giỏ hàng ở thiết bị khác)
export const useCartStore = create<CartState>((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
}));