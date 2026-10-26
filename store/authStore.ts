import { create } from "zustand";
import type { AuthUser } from "@/types/auth";
export type { AuthUser } from "@/types/auth";
export type AuthStatus = "checking" | "authenticated" | "anonymous";
interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  generation: number;
  notice: string | null;
  retryAt: number | null;
  recoveryRequiresLogin: boolean;
}
// UI state only; credentials are never persisted or exposed by this store.
export const useAuthStore = create<AuthState>(() => ({
  user: null, status: "checking", isAuthenticated: false, generation: 0, notice: null, retryAt: null, recoveryRequiresLogin: false,
}));
