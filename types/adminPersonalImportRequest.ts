export type PersonalImportRequestStatus = "New" | "Contacted" | "Quoted" | "Completed" | "Cancelled";

export interface AdminPersonalImportRequest {
  id: string;
  productName: string;
  productLink: string | null;
  quantity: number;
  notes: string | null;
  imageUrl: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  userId: string | null;
  status: PersonalImportRequestStatus;
  adminNote: string | null;
  createdAt: string;
}
