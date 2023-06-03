import {createAsyncThunk} from "@reduxjs/toolkit";
import fetchWithLocale from "@/utils/fetchWrapper";


export const fetchCollections = createAsyncThunk(
    'collections/fetchCollections',
    async (locale: string | undefined, thunkAPI) => {
        const apiFetch = fetchWithLocale(locale || 'uk')
        const response = await apiFetch.get('/category/collections/')
        return response.data
    }
)