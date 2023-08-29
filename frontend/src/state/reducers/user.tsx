import type {PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import {UserState} from '@/interfaces/user'


const initialState: UserState = {
    uuid: null,
    email: null,
    phone: null,
    first_name: null,
    last_name: null,
    father_name: null,
    date_of_birth: null,
    token: null,
    viewedProductsIds: [],
    viewedProductsData: [],
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<UserState>) => {
            state = action.payload
        },
        clearUser: (state) => {
            state = initialState
        },
        setViewedProductsIds: (state, action: PayloadAction<number[]>) => {
            state.viewedProductsIds = action.payload
        },
        setViewedProductsData: (state, action: PayloadAction<any[]>) => {
            state.viewedProductsData = action.payload
        },
        addViewedProductData: (state, action: PayloadAction<any>) => {
            const index = state.viewedProductsIds.findIndex(id => id === action.payload.id);

            if (index === -1) {
                state.viewedProductsIds.unshift(action.payload.id)
                state.viewedProductsData.unshift(action.payload)
            } else {
                const id = state.viewedProductsIds[index]

                state.viewedProductsIds.splice(index, 1)
                state.viewedProductsIds.splice(0, 0, id)

                if (state.viewedProductsData.length > 0) {
                    const data = state.viewedProductsData[index]
                    state.viewedProductsData.splice(index, 1)
                    state.viewedProductsData.splice(0, 0, data)
                }
            }

            // Ensure arrays don't exceed 24 items
            state.viewedProductsIds = state.viewedProductsIds.slice(0, 24);
            state.viewedProductsData = state.viewedProductsData.slice(0, 24);

            if (typeof window !== 'undefined') {
                localStorage.setItem('user.viewedProductsIds', JSON.stringify(state.viewedProductsIds));
            }
        },
        clearViewedProducts: (state) => {
            state.viewedProductsIds = []
            state.viewedProductsData = []
        }
    },
})

export const {setUser, clearUser, setViewedProductsIds, setViewedProductsData, addViewedProductData, clearViewedProducts} = userSlice.actions

export const selectUser = (state: RootState) => state.user
export const selectUserViewedProductsIds = (state: RootState) => state.user.viewedProductsIds
export const selectUserViewedProductsData = (state: RootState) => state.user.viewedProductsData

export default userSlice.reducer