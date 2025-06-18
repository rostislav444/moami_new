import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartStore, CartItem } from '@/types/cart';

const calculateTotal = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, quantity };
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      quantity: 0,
      isOpen: false,

      addItem: (newItem) => {
        const { items } = get();
        const existingItem = items.find((item) => item.id === newItem.id);

        if (existingItem) {
          if (existingItem.quantity < existingItem.stock) {
            const updatedItems = items.map((item) =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
            const { total, quantity } = calculateTotal(updatedItems);
            set({ items: updatedItems, total, quantity, isOpen: true });
          }
        } else {
          const itemWithQuantity = { ...newItem, quantity: 1 };
          const updatedItems = [...items, itemWithQuantity];
          const { total, quantity } = calculateTotal(updatedItems);
          set({ items: updatedItems, total, quantity, isOpen: true });
        }
      },

      updateItem: (id, newQuantity) => {
        const { items } = get();
        const item = items.find((item) => item.id === id);
        
        if (item && newQuantity <= item.stock && newQuantity > 0) {
          const updatedItems = items.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
          );
          const { total, quantity } = calculateTotal(updatedItems);
          set({ items: updatedItems, total, quantity });
        }
      },

      removeItem: (id) => {
        const { items } = get();
        const updatedItems = items.filter((item) => item.id !== id);
        const { total, quantity } = calculateTotal(updatedItems);
        set({ items: updatedItems, total, quantity });
      },

      clearCart: () => {
        set({ items: [], total: 0, quantity: 0, isOpen: false });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      closeCart: () => {
        set({ isOpen: false });
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        total: state.total,
        quantity: state.quantity,
      }),
    }
  )
); 