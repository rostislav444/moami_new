import type {Draft, PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'
import {CartItemState, CartState} from '@/interfaces/cart'
import {RootState} from "@/state/store";


const getInitialState = (): CartState => {
    if (typeof window !== 'undefined') {
        const cart = localStorage.getItem('cart');
        if (cart !== undefined && cart !== null) {
            return JSON.parse(cart)
        }
    }
    return {
        items: [],
        total: 0,
        quantity: 0,
    };

};

const initialState: CartState = getInitialState();


const calculateTotal = (state: Draft<CartState>) => {
    state.total = 0
    state.quantity = 0
    state.items.map((item) => {
        state.total += item.price * item.quantity
        state.quantity += item.quantity
    })
    localStorage.setItem('user.cart', JSON.stringify(state))
    return state
}


export const cartSlice = createSlice({
        name: 'cart',
        initialState,
        reducers: {
            setCart: (state, action: PayloadAction<CartState>) => {
                return action.payload
            },
            addItemToCart: (state: Draft<CartState>, action: PayloadAction<CartItemState>) => {
                const item = state.items.find((item) => item.id === action.payload.id)
                if (item) {
                    if (item.quantity < item.stock) {
                        item.quantity++
                    }
                } else {
                    state.items.push(action.payload)
                }
                return calculateTotal(state)

            },
            updateItemInCart: (state, action: PayloadAction<{ id: number, quantity: number }>) => {
                const item = state.items.find((item) => item.id === action.payload.id)
                if (item) {
                    if (action.payload.quantity <= item.stock) {
                        item.quantity = action.payload.quantity
                    }
                }
                return calculateTotal(state)
            },
            removeItemFromCart: (state, action: PayloadAction<number>) => {
                const item = state.items.find((item) => item.id === action.payload)
                if (item) {
                    state.items = state.items.filter((item) => item.id !== action.payload)
                }
                return calculateTotal(state)
            },
            clearCart: (state) => {
                state.items = []
                return calculateTotal(state)
            }
        },
    }
)

export const {setCart, addItemToCart, updateItemInCart, removeItemFromCart, clearCart} = cartSlice.actions

export const selectCart = (state: RootState) => state.cart

export default cartSlice.reducer



