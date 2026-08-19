export interface WishlistItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  minPrice: number;
  maxPrice: number;
  purchaseBatchName: string | null;
  isAvailable: boolean;
  addedAt: string;
}