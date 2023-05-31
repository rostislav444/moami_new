import {createAsyncThunk} from "@reduxjs/toolkit";

import {BASE_URL} from "@/context/api";
import fetchWithLocale from "@/utils/fetchWrapper";


export const fetchSizeGrids = createAsyncThunk(
    'sizes/fetchSizeGrids',
    async (locale: string | undefined, thunkAPI) => {
        const apiFetch = fetchWithLocale(locale || 'uk')
        const response = await apiFetch.get('/sizes/size-grids/')
        return response.data
    }
)