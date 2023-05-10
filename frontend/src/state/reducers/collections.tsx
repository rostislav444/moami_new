import type {PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import {CollectionsProps, CollectionsState} from '@/interfaces/collections'
import {fetchCollections} from "@/state/actions/collections";


const initialState: CollectionsProps = {
  collections: [],
}

export const collectionsSlice = createSlice({
  name: 'collections',
  initialState,
  reducers: {
    update: (state, action: PayloadAction<CollectionsState[]>) => {
      state.collections = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCollections.pending, (state) => {
        state.collections = []; // clear categories when the request starts
      })
      .addCase(fetchCollections.fulfilled, (state, action) => {
        state.collections = action.payload;
      });
  },
})

export const { update } = collectionsSlice.actions

export const selectCollections = (state: RootState) => state.collections

export default collectionsSlice.reducer