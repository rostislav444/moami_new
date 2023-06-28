import {createAsyncThunk} from "@reduxjs/toolkit";
import fetchWithLocale from "@/utils/fetchWrapper";


export const fetchCategories = createAsyncThunk(
    'categories/fetchCategories',
    async (locale: string | undefined, thunkAPI) => {
        const apiFetch = fetchWithLocale(locale || 'uk')
        const response = await apiFetch.get('/category/categories/')
        return response.data
    }
)