export interface AdminPurchaseBatch {
  id: string;
  name: string;
  countryOfOrigin: string | null;
  openDate: string;
  closeDate: string;
  estimatedArrivalDate: string | null;
  status: string;
  productCount: number;
}