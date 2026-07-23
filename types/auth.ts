import { AuthUser } from "@/store/authStore";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  userId: string;
  email: string;
}