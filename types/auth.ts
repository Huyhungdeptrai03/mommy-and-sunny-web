export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  emailVerified: boolean;
}
export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
}
export interface RegisterResponse { userId: string; email: string; }
export type ExternalProvider = "google" | "facebook";
