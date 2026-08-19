export interface ProductImage {
  url: string;
  isPrimary: boolean;
}

export interface ProductSpecification {
  label: string;
  value: string;
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
  ageRangeMinMonths: number | null;
  ageRangeMaxMonths: number | null;
  averageRating: number | null;
  reviewCount: number;
  purchaseBatchName: string | null;
  estimatedArrivalDate: string | null;
  images: ProductImage[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
}

export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  primaryImageUrl: string | null;
  purchaseBatchName: string | null;
  minPrice: number;
  maxPrice: number;
}
