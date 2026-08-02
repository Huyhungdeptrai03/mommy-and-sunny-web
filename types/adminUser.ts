export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  emailVerified: boolean;
  orderCount: number;
  createdAt: string;
}