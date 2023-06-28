import type {PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import {SizeGridState, SizeGridProps} from "@/interfaces/sizes";
import {fetchSizeGrids} from "@/state/actions/sizeGrids";


const initialState: SizeGridProps = {
    sizeGrids: [],
    selected: null,
}

export const sizesSlice = createSlice({
  name: 'sizes',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<SizeGridState[]>) => {
      state.sizeGrids = action.payload
    },
    selectGrid: (state, action: PayloadAction<string>) => {
        state.selected = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSizeGrids.pending, (state) => {
        state.sizeGrids = [];
      })
      .addCase(fetchSizeGrids.fulfilled, (state, action) => {
        state.sizeGrids = action.payload;
        const defaultSizeGrid = state.sizeGrids.find(sizeGrid => sizeGrid.is_default);
        if (defaultSizeGrid) {
            state.selected = defaultSizeGrid.slug;
        } else {
            state.selected = state.sizeGrids[0].slug;
        }
      });
  },
})

export const { update, selectGrid } = sizesSlice.actions

export const selectSizes = (state: RootState) => state.sizes

export default sizesSlice.reducer