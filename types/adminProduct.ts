export interface AdminProductListItem {
  id: string;
  name: string;
  slug: string;
  status: string;
  brand: string | null;
  categoryName: string;
  variantCount: number;
  totalStock: number;
  createdAt: string;
}

export interface ProductImageAdmin {
  id: string;
  imageUrl: string;
  isPrimary: boolean;
  displayOrder: number;
}

export interface ProductSpecificationAdmin {
  id: string;
  label: string;
  value: string;
  displayOrder: number;
}

export interface ProductVariantAdmin {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  compareAtPrice: number | null;
  saleEndsAt: string | null;
  stockQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface AdminProductDetail {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  ageRangeMinMonths: number | null;
  ageRangeMaxMonths: number | null;
  status: string;
  purchaseBatchId: string | null;
  purchaseBatchName: string | null;
  images: ProductImageAdmin[];
  specifications: ProductSpecificationAdmin[];
  variants: ProductVariantAdmin[];
}