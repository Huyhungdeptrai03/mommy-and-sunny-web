export interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  availableQuantity: number;
}
 
export interface ProductImage {
  url: string;
  isPrimary: boolean;
}
 
export interface ProductListItem {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  primaryImageUrl: string | null;
  minPrice: number;
  maxPrice: number;
}
 
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  ageRangeMinMonths: number;
  ageRangeMaxMonths: number;
  images: ProductImage[];
  variants: ProductVariant[];
}