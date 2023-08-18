import {SizeGridState, SizesState} from "@/interfaces/sizes";
import {createSlice} from '@reduxjs/toolkit'
import type {PayloadAction} from '@reduxjs/toolkit'
import {RootState} from "@/state/store";


const initialState: SizesState = {
    sizeGrids: [],
    selected: null,
}

const sizesSlice = createSlice({
  name: 'sizes',
  initialState,
  reducers: {
    setSizeGrids: (state, action: PayloadAction<SizeGridState[]>) => {
      state.sizeGrids = action.payload
    },
    selectGrid: (state, action: PayloadAction<string>) => {
        state.selected = action.payload;
    }
  },
})

export const { setSizeGrids, selectGrid } = sizesSlice.actions

export const selectSizes = (state: RootState) => state.sizes.sizeGrids

export const selectSelectedGrid = (state: RootState) => state.sizes.selected

export default sizesSlice.reducer