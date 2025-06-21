export interface CartItem {
  id: number;
  stock: number;
  image: string;
  size: {
    ua: string;
    int: string;
    eu: string;
  };
  quantity: number;
  name: string;
  slug: string;
  code: string;
  price: number;
  old_price?: number;
  selectedGrid: string;
  variantId: number;
  sizeId: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  quantity: number;
  isOpen: boolean;
}

export interface CartStore extends CartState {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  updateItem: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
} 