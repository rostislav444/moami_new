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
        setSelectSizeGrid: (state, action) => {
            const {parenId, id, sizeGrid} = action.payload
            const parentCategory = state.categories.find(category => category.id === parenId)
            if (parentCategory) {
                const category = parentCategory.children.find(category => category.id === id)
                if (category) {
                    category.selected_size_grid = sizeGrid
                }
            }
        }
    },
})

export const {setCategories, setSelectSizeGrid} = categoriesSlice.actions

export const selectCategories = (state: any) => state.categories.categories

export default categoriesSlice.reducer
