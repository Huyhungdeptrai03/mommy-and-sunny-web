export interface FlashSaleItem {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  variantId: string;
  price: number;
  compareAtPrice: number;
  discountPercent: number;
  saleEndsAt: string;
  availableQuantity: number;
}