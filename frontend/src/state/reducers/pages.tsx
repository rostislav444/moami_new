import type {PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'
import type {RootState} from '../store'
import {fetchPages} from "@/state/actions/pages";
import {PageState} from "@/interfaces/pages";


interface PagesProps {
    pages: PageState[]
}

const initialState: PagesProps = {
    pages: [],
}

export const pagesSlice = createSlice({
    name: 'pages',
    initialState,
    reducers: {
        update: (state, action: PayloadAction<PageState[]>) => {
            state.pages = action.payload
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPages.pending, (state) => {
                state.pages = [];
            })
            .addCase(fetchPages.fulfilled, (state, action) => {
                state.pages = action.payload;
            });
    },
})

export const {update} = pagesSlice.actions

export const selectPages = (state: RootState) => state.pages

export default pagesSlice.reducer