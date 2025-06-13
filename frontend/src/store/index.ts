import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { subscribeWithSelector } from 'zustand/middleware'

export interface CartItem {
  id: number
  stock: number
  image: string
  size: {
    [key: string]: string | number
  }
  quantity: number
  name: string
  slug: string
  price: number
  old_price: number
  selectedGrid: string
}

export interface UserState {
  isAuthenticated: boolean
  user: any
  viewedProductsIds: number[]
  viewedProductsData: any[]
}

export interface AppState {
  cart: {
    items: CartItem[]
    total: number
    quantity: number
  }
  user: UserState
  categories: any[]
  collections: any[]
  sizeGrids: any[]
  pages: any[]
  routing: {
    currentRoute: string
    previousRoute: string
  }
  
  addToCart: (item: CartItem) => void
  updateCartItem: (id: number, quantity: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  
  setUser: (user: any) => void
  setViewedProducts: (products: any[]) => void
  addViewedProduct: (productId: number) => void
  
  setCategories: (categories: any[]) => void
  setCollections: (collections: any[]) => void
  setSizeGrids: (grids: any[]) => void
  setPages: (pages: any[]) => void
  
  setCurrentRoute: (route: string) => void
}

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
  return { total, quantity }
}

export const useStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        cart: {
          items: [],
          total: 0,
          quantity: 0,
        },
        user: {
          isAuthenticated: false,
          user: null,
          viewedProductsIds: [],
          viewedProductsData: [],
        },
        categories: [],
        collections: [],
        sizeGrids: [],
        pages: [],
        routing: {
          currentRoute: '',
          previousRoute: '',
        },
        
        addToCart: (newItem: CartItem) => {
          const { cart } = get()
          const existingItem = cart.items.find(item => item.id === newItem.id)
          
          let updatedItems
          if (existingItem) {
            if (existingItem.quantity < existingItem.stock) {
              updatedItems = cart.items.map(item =>
                item.id === newItem.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              )
            } else {
              updatedItems = cart.items
            }
          } else {
            updatedItems = [...cart.items, { ...newItem, quantity: 1 }]
          }
          
          const { total, quantity } = calculateTotals(updatedItems)
          
          set({
            cart: {
              items: updatedItems,
              total,
              quantity,
            }
          })
        },
        
        updateCartItem: (id: number, quantity: number) => {
          const { cart } = get()
          const updatedItems = cart.items.map(item => {
            if (item.id === id && quantity <= item.stock) {
              return { ...item, quantity }
            }
            return item
          })
          
          const { total, quantity: totalQuantity } = calculateTotals(updatedItems)
          
          set({
            cart: {
              items: updatedItems,
              total,
              quantity: totalQuantity,
            }
          })
        },
        
        removeFromCart: (id: number) => {
          const { cart } = get()
          const updatedItems = cart.items.filter(item => item.id !== id)
          const { total, quantity } = calculateTotals(updatedItems)
          
          set({
            cart: {
              items: updatedItems,
              total,
              quantity,
            }
          })
        },
        
        clearCart: () => {
          set({
            cart: {
              items: [],
              total: 0,
              quantity: 0,
            }
          })
        },
        
        setUser: (user: any) => {
          set(state => ({
            user: {
              ...state.user,
              user,
              isAuthenticated: !!user,
            }
          }))
        },
        
        setViewedProducts: (products: any[]) => {
          set(state => ({
            user: {
              ...state.user,
              viewedProductsData: products,
            }
          }))
        },
        
        addViewedProduct: (productId: number) => {
          set(state => {
            const viewedIds = state.user.viewedProductsIds
            if (!viewedIds.includes(productId)) {
              return {
                user: {
                  ...state.user,
                  viewedProductsIds: [productId, ...viewedIds.slice(0, 19)],
                }
              }
            }
            return state
          })
        },
        
        setCategories: (categories: any[]) => {
          set({ categories })
        },
        
        setCollections: (collections: any[]) => {
          set({ collections })
        },
        
        setSizeGrids: (grids: any[]) => {
          set({ sizeGrids: grids })
        },
        
        setPages: (pages: any[]) => {
          set({ pages })
        },
        
        setCurrentRoute: (route: string) => {
          set(state => ({
            routing: {
              previousRoute: state.routing.currentRoute,
              currentRoute: route,
            }
          }))
        },
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          cart: state.cart,
          user: {
            viewedProductsIds: state.user.viewedProductsIds,
          }
        }),
      }
    )
  )
) 