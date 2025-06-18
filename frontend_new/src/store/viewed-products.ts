import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ViewedProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  old_price?: number;
  image: string;
  color: {
    id: number;
    name: string;
    code: string;
  };
}

interface ViewedProductsState {
  viewedProducts: ViewedProduct[];
  addViewedProduct: (product: ViewedProduct) => void;
  clearViewedProducts: () => void;
}

export const useViewedProductsStore = create<ViewedProductsState>()(
  persist(
    (set) => ({
      viewedProducts: [],
      
      addViewedProduct: (product) =>
        set((state) => {
          const existingIndex = state.viewedProducts.findIndex(
            (p) => p.id === product.id
          );

          let newViewedProducts;
          
          if (existingIndex !== -1) {
            // Товар уже есть, переместить в начало
            newViewedProducts = [
              product,
              ...state.viewedProducts.filter((p) => p.id !== product.id),
            ];
          } else {
            // Новый товар, добавить в начало
            newViewedProducts = [product, ...state.viewedProducts];
          }

          // Ограничить до 24 товаров
          newViewedProducts = newViewedProducts.slice(0, 24);

          return { viewedProducts: newViewedProducts };
        }),
        
      clearViewedProducts: () => set({ viewedProducts: [] }),
    }),
    {
      name: 'viewed-products-storage',
      partialize: (state) => ({ viewedProducts: state.viewedProducts }),
    }
  )
); 