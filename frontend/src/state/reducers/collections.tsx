import {createSlice} from "@reduxjs/toolkit";
import {CollectionsProps} from "@/interfaces/collections";


const initialState: CollectionsProps = {
    collections: [],
}


const collectionSlice = createSlice({
    name: 'collections',
    initialState,
    reducers: {
        setCollections: (state, action) => {
            state.collections = action.payload
        },
    },
})

export const {setCollections} = collectionSlice.actions

export const selectCollections = (state: any) => state.collections.collections

export default collectionSlice.reducer
