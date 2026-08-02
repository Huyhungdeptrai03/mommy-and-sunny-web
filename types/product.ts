export interface ProductImage {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  compareAtPrice: number | null;
  saleEndsAt: string | null;
  availableQuantity: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  averageRating: number | null;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  primaryImageUrl: string | null;
  minPrice: number;
  maxPrice: number;
}