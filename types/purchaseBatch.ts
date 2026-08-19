export interface PublicPurchaseBatch {
  id: string;
  name: string;
  countryOfOrigin: string | null;
  closeDate: string;
  estimatedArrivalDate: string | null;
  productCount: number;
}