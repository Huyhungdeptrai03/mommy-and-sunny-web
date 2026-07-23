export interface CartItem {
  itemId: string;
  productVariantId: string;
  productName: string;
  size: string | null;
  color: string | null;
  unitPrice: number;
  quantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  warning: string | null;
}

export interface Cart {
  items: CartItem[];
  subTotal: number;
}