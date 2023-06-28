import {createAsyncThunk} from "@reduxjs/toolkit";
import fetchWithLocale from "@/utils/fetchWrapper";


export const fetchPages = createAsyncThunk(
    'pages/fetchPages',
    async (locale: string | undefined, thunkAPI) => {
        const apiFetch = fetchWithLocale(locale || 'uk')
        const response = await apiFetch.get('/pages/pages/')
        return response.data
    }
)