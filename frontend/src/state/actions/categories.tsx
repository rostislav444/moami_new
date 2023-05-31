import {createAsyncThunk} from "@reduxjs/toolkit";

import {BASE_URL} from "@/context/api";
import fetchWithLocale from "@/utils/fetchWrapper";


export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (locale: string | undefined, thunkAPI) => {
        console.log('fetchCategories', fetchCategories)
        const apiFetch = fetchWithLocale(locale || 'uk')
        const response = await apiFetch.get('/category/categories/')
        return response.data
    }
)