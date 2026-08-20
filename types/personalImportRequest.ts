export interface PersonalImportRequestResult {
  id: string;
  productName: string;
  status: string;
  createdAt: string;
}

export interface CreatePersonalImportRequestPayload {
  productName: string;
  productLink?: string;
  quantity: number;
  notes?: string;
  imageUrl?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
}
