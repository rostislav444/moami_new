import type {PayloadAction} from '@reduxjs/toolkit'
import {createSlice} from '@reduxjs/toolkit'
import type {RootState} from '../store'
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
        setPages: (state, action: PayloadAction<PageState[]>) => {
            state.pages = action.payload
        },
    },
})

export const {setPages} = pagesSlice.actions

export const selectPages = (state: RootState) => state.pages

export default pagesSlice.reducer