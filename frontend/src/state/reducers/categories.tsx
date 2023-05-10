import type {PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import {CategoryProps, CategoryState} from '@/interfaces/categories'
import {fetchCategories} from "@/state/actions/categories";


const initialState: CategoryProps = {
  categories: [],
}

export const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<CategoryState[]>) => {
      state.categories = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.categories = []; // clear categories when the request starts
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      });
  },
})

export const { update } = categoriesSlice.actions

export const selectCategories = (state: RootState) => state.categories

export default categoriesSlice.reducer