export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  imageUrl: string | null;
  productCount: number;
}