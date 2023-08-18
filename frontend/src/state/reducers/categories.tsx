import {createSlice} from "@reduxjs/toolkit";
import {CategoryProps} from "@/interfaces/categories";


const initialState: CategoryProps = {
    categories: [],
}


export const categoriesSlice = createSlice({
    name: 'categories',
    initialState,
    reducers: {
        setCategories: (state, action) => {
            state.categories = action.payload
        },
    },
})

export const {setCategories} = categoriesSlice.actions

export const selectCategories = (state: any) => state.categories.categories

export default categoriesSlice.reducer
